<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\DiningTable;
use App\Models\InventoryStock;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\ReceiptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::query()
            ->with(['items', 'payments', 'table'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('receipt_number')) {
            $query->where('receipt_number', 'like', '%' . $request->get('receipt_number') . '%');
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->get('table_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->get('date'));
        }

        $perPage = (int) $request->get('per_page', 20);

        return OrderResource::collection($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $this->validateOrderPayload($request);

        $user = $request->user();

        $order = DB::transaction(function () use ($data, $user) {
            $receiptNumber = ReceiptService::nextReceiptNumber();

            $itemsPayload = $this->buildItemsPayload($data['items']);
            $totals = $this->calculateTotals($itemsPayload, $data);

            $shiftId = $user->shifts()->whereNull('closed_at')->latest('opened_at')->value('id');

            $order = Order::create([
                'receipt_number' => $receiptNumber,
                'status' => Order::STATUS_PENDING,
                'dine_type' => $data['dine_type'],
                'table_id' => $data['table_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
                'service_charge_rate' => $totals['service_charge_rate'],
                'service_charge_amount' => $totals['service_charge_amount'],
                'tax_rate' => $totals['tax_rate'],
                'tax_amount' => $totals['tax_amount'],
                'rounding' => $totals['rounding'],
                'total' => $totals['total'],
                'paid_total' => 0,
                'balance' => $totals['total'],
                'held_at' => $data['hold'] ? now() : null,
                'cashier_id' => $user->id,
                'shift_id' => $shiftId,
            ]);

            $order->items()->createMany($itemsPayload);

            return $order;
        });

        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function show(Order $order)
    {
        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function update(Request $request, Order $order)
    {
        if ($order->status !== Order::STATUS_PENDING) {
            return response()->json(['message' => 'Only pending orders can be edited.'], 422);
        }

        $data = $this->validateOrderPayload($request, true);

        $order = DB::transaction(function () use ($order, $data) {
            $itemsPayload = $this->buildItemsPayload($data['items']);
            $totals = $this->calculateTotals($itemsPayload, $data);

            $order->update([
                'dine_type' => $data['dine_type'],
                'table_id' => $data['table_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
                'service_charge_rate' => $totals['service_charge_rate'],
                'service_charge_amount' => $totals['service_charge_amount'],
                'tax_rate' => $totals['tax_rate'],
                'tax_amount' => $totals['tax_amount'],
                'rounding' => $totals['rounding'],
                'total' => $totals['total'],
                'balance' => round($totals['total'] - $order->paid_total, 2),
            ]);

            $order->items()->delete();
            $order->items()->createMany($itemsPayload);

            return $order;
        });

        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function hold(Order $order)
    {
        if ($order->status !== Order::STATUS_PENDING) {
            return response()->json(['message' => 'Only pending orders can be held.'], 422);
        }

        $order->update(['held_at' => now()]);

        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function resume(Order $order)
    {
        $order->update(['held_at' => null]);

        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function confirm(Order $order)
    {
        if ($order->status !== Order::STATUS_PENDING) {
            return response()->json(['message' => 'Order cannot be confirmed.'], 422);
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'status' => Order::STATUS_CONFIRMED,
                'confirmed_at' => now(),
                'held_at' => null,
            ]);

            if ($order->dine_type === 'dine_in' && $order->table_id) {
                DiningTable::query()->where('id', $order->table_id)->update(['status' => 'occupied']);
            }

            $order->load('items');

            foreach ($order->items as $item) {
                $stock = InventoryStock::firstOrCreate(
                    ['product_id' => $item->product_id],
                    ['current_stock' => 0, 'reorder_level' => 0]
                );

                $before = $stock->current_stock;
                $after = $before - $item->qty;

                $stock->update(['current_stock' => $after]);

                StockMovement::create([
                    'product_id' => $item->product_id,
                    'type' => 'sale',
                    'quantity' => -1 * $item->qty,
                    'before_stock' => $before,
                    'after_stock' => $after,
                    'reference_type' => Order::class,
                    'reference_id' => $order->id,
                    'user_id' => $order->cashier_id,
                    'notes' => 'Order confirmed',
                ]);
            }
        });

        return new OrderResource($order->refresh()->load(['items', 'payments', 'table']));
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                Order::STATUS_PREPARING,
                Order::STATUS_READY,
                Order::STATUS_SERVED,
                Order::STATUS_COMPLETED,
            ])],
        ]);

        $updates = ['status' => $data['status']];

        if ($data['status'] === Order::STATUS_PREPARING) {
            $updates['preparing_at'] = $order->preparing_at ?? now();
        }

        if ($data['status'] === Order::STATUS_READY) {
            $updates['ready_at'] = $order->ready_at ?? now();
        }

        if ($data['status'] === Order::STATUS_SERVED || $data['status'] === Order::STATUS_COMPLETED) {
            $updates['served_at'] = $order->served_at ?? now();
            if ($order->dine_type === 'dine_in' && $order->table_id) {
                DiningTable::query()->where('id', $order->table_id)->update(['status' => 'available']);
            }
        }

        $order->update($updates);

        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function cancel(Request $request, Order $order)
    {
        if ($order->status === Order::STATUS_CANCELLED) {
            return response()->json(['message' => 'Order already cancelled.'], 422);
        }

        $data = $request->validate([
            'admin_pin' => ['required', 'string'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $admin = User::role('admin')->where('is_active', true)->get()
            ->first(fn (User $user) => $user->pin_hash && Hash::check($data['admin_pin'], $user->pin_hash));

        if (!$admin) {
            return response()->json(['message' => 'Invalid admin PIN.'], 403);
        }

        $order->update([
            'status' => Order::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'voided_by' => $admin->id,
            'void_reason' => $data['reason'] ?? null,
        ]);

        if ($order->dine_type === 'dine_in' && $order->table_id) {
            DiningTable::query()->where('id', $order->table_id)->update(['status' => 'available']);
        }

        return new OrderResource($order->load(['items', 'payments', 'table']));
    }

    public function addPayment(Request $request, Order $order)
    {
        $data = $request->validate([
            'method' => ['required', Rule::in(['cash', 'gcash', 'card'])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reference_no' => ['nullable', 'string', 'max:120'],
        ]);

        $payment = DB::transaction(function () use ($order, $data, $request) {
            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => $data['method'],
                'amount' => $data['amount'],
                'reference_no' => $data['reference_no'] ?? null,
                'paid_at' => now(),
                'received_by' => $request->user()->id,
            ]);

            $paidTotal = (float) $order->payments()->sum('amount');
            $balance = round((float) $order->total - $paidTotal, 2);

            $order->update([
                'paid_total' => $paidTotal,
                'balance' => $balance,
            ]);

            return $payment;
        });

        return new PaymentResource($payment);
    }

    public function payments(Order $order)
    {
        return PaymentResource::collection($order->payments()->orderBy('created_at')->get());
    }

    private function validateOrderPayload(Request $request, bool $isUpdate = false): array
    {
        $rules = [
            'dine_type' => ['required', Rule::in(['dine_in', 'takeout', 'delivery'])],
            'table_id' => ['nullable', 'exists:tables,id'],
            'customer_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'service_charge_rate' => ['nullable', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0'],
            'rounding' => ['nullable', 'numeric'],
            'hold' => ['nullable', 'boolean'],
        ];

        $data = $request->validate($rules);

        if ($data['dine_type'] === 'dine_in' && empty($data['table_id'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'table_id' => ['Table is required for dine-in orders.'],
            ]);
        }

        if ($data['dine_type'] === 'delivery') {
            if (empty($data['customer_name']) || empty($data['phone']) || empty($data['address'])) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'delivery' => ['Customer name, phone, and address are required for delivery orders.'],
                ]);
            }
        }

        if (!array_key_exists('hold', $data)) {
            $data['hold'] = false;
        }

        return $data;
    }

    private function buildItemsPayload(array $items): array
    {
        $products = Product::query()
            ->whereIn('id', collect($items)->pluck('product_id')->all())
            ->get()
            ->keyBy('id');

        return collect($items)->map(function ($item) use ($products) {
            $product = $products[$item['product_id']];
            $price = (float) $product->price;
            $qty = (int) $item['qty'];
            $itemDiscount = isset($item['discount_amount']) ? (float) $item['discount_amount'] : 0;
            $lineSubtotal = round($price * $qty, 2);
            $lineTotal = round($lineSubtotal - $itemDiscount, 2);

            return [
                'product_id' => $product->id,
                'name_snapshot' => $product->name,
                'price' => $price,
                'qty' => $qty,
                'discount_amount' => $itemDiscount,
                'notes' => $item['notes'] ?? null,
                'line_total' => $lineTotal,
            ];
        })->values()->all();
    }

    private function calculateTotals(array $itemsPayload, array $data): array
    {
        $subtotal = 0;
        $itemDiscounts = 0;
        foreach ($itemsPayload as $item) {
            $lineSubtotal = round($item['price'] * $item['qty'], 2);
            $subtotal += $lineSubtotal;
            $itemDiscounts += (float) $item['discount_amount'];
        }

        $orderDiscount = isset($data['discount_amount']) ? (float) $data['discount_amount'] : 0;
        $discountTotal = round($itemDiscounts + $orderDiscount, 2);

        $netBase = max(round($subtotal - $discountTotal, 2), 0);

        $serviceRate = isset($data['service_charge_rate']) ? (float) $data['service_charge_rate'] : 0;
        $taxRate = isset($data['tax_rate']) ? (float) $data['tax_rate'] : 0;
        $rounding = isset($data['rounding']) ? (float) $data['rounding'] : 0;

        $serviceAmount = round($netBase * ($serviceRate / 100), 2);
        $taxAmount = round($netBase * ($taxRate / 100), 2);
        $total = round($netBase + $serviceAmount + $taxAmount + $rounding, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => $discountTotal,
            'service_charge_rate' => $serviceRate,
            'service_charge_amount' => $serviceAmount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'rounding' => $rounding,
            'total' => $total,
        ];
    }
}
