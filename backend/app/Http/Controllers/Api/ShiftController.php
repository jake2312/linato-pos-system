<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CashierShiftResource;
use App\Models\CashierShift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function open(Request $request)
    {
        $data = $request->validate([
            'opening_cash' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        $existing = $user->shifts()->whereNull('closed_at')->first();
        if ($existing) {
            return response()->json(['message' => 'Shift already open.'], 422);
        }

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => now(),
            'opening_cash' => $data['opening_cash'],
        ]);

        return new CashierShiftResource($shift);
    }

    public function close(Request $request)
    {
        $data = $request->validate([
            'closing_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $shift = $user->shifts()->whereNull('closed_at')->latest('opened_at')->first();

        if (!$shift) {
            return response()->json(['message' => 'No open shift found.'], 404);
        }

        $cashPayments = DB::table('payments')
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->where('orders.shift_id', $shift->id)
            ->where('payments.method', 'cash')
            ->sum('payments.amount');

        $expected = (float) $cashPayments + (float) $shift->opening_cash;
        $discrepancy = (float) $data['closing_cash'] - $expected;

        $shift->update([
            'closing_cash' => $data['closing_cash'],
            'expected_cash' => $expected,
            'discrepancy' => $discrepancy,
            'closed_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        return new CashierShiftResource($shift);
    }

    public function show(CashierShift $shift)
    {
        return new CashierShiftResource($shift);
    }
}
