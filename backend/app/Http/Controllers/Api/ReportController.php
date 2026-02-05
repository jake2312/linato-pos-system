<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function daily(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $orders = Order::query()
            ->whereDate('created_at', $date)
            ->where('status', '!=', Order::STATUS_CANCELLED);

        $summary = [
            'date' => $date,
            'order_count' => (clone $orders)->count(),
            'gross_sales' => (float) (clone $orders)->sum('subtotal'),
            'discounts' => (float) (clone $orders)->sum('discount_amount'),
            'tax' => (float) (clone $orders)->sum('tax_amount'),
            'service_charge' => (float) (clone $orders)->sum('service_charge_amount'),
            'net_sales' => (float) (clone $orders)->sum('total'),
        ];

        return response()->json($summary);
    }

    public function salesByProduct(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $rows = OrderItem::query()
            ->select([
                'product_id',
                'name_snapshot',
                DB::raw('SUM(qty) as total_qty'),
                DB::raw('SUM(line_total) as total_sales'),
            ])
            ->whereHas('order', function ($q) use ($date) {
                $q->whereDate('created_at', $date)
                    ->where('status', '!=', Order::STATUS_CANCELLED);
            })
            ->groupBy('product_id', 'name_snapshot')
            ->orderByDesc('total_sales')
            ->get();

        return response()->json($rows);
    }

    public function salesByCategory(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereDate('orders.created_at', $date)
            ->where('orders.status', '!=', Order::STATUS_CANCELLED)
            ->groupBy('categories.id', 'categories.name')
            ->select([
                'categories.id',
                'categories.name',
                DB::raw('SUM(order_items.qty) as total_qty'),
                DB::raw('SUM(order_items.line_total) as total_sales'),
            ])
            ->orderByDesc('total_sales')
            ->get();

        return response()->json($rows);
    }

    public function shift(Request $request)
    {
        $shiftId = $request->get('shift_id');

        $shift = $shiftId
            ? CashierShift::findOrFail($shiftId)
            : $request->user()->shifts()->whereNull('closed_at')->latest('opened_at')->first();

        if (!$shift) {
            return response()->json(['message' => 'No open shift found.'], 404);
        }

        $cashPayments = DB::table('payments')
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->where('orders.shift_id', $shift->id)
            ->where('payments.method', 'cash')
            ->sum('payments.amount');

        $expected = (float) $cashPayments + (float) $shift->opening_cash;
        $discrepancy = (float) $shift->closing_cash - $expected;

        return response()->json([
            'shift_id' => $shift->id,
            'user_id' => $shift->user_id,
            'opened_at' => $shift->opened_at,
            'closed_at' => $shift->closed_at,
            'opening_cash' => (float) $shift->opening_cash,
            'closing_cash' => (float) $shift->closing_cash,
            'expected_cash' => $expected,
            'discrepancy' => $discrepancy,
        ]);
    }
}
