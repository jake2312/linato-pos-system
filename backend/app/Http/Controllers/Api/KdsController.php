<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KdsController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::query()
            ->with(['items', 'table'])
            ->whereIn('status', [
                Order::STATUS_CONFIRMED,
                Order::STATUS_PREPARING,
                Order::STATUS_READY,
            ])
            ->orderBy('confirmed_at');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        return OrderResource::collection($query->get());
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([Order::STATUS_PREPARING, Order::STATUS_READY])],
        ]);

        if ($data['status'] === Order::STATUS_PREPARING) {
            $order->update([
                'status' => Order::STATUS_PREPARING,
                'preparing_at' => now(),
            ]);
        }

        if ($data['status'] === Order::STATUS_READY) {
            $order->update([
                'status' => Order::STATUS_READY,
                'ready_at' => now(),
            ]);
        }

        return new OrderResource($order->load(['items', 'table']));
    }
}
