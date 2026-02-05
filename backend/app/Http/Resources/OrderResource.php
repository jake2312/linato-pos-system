<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'status' => $this->status,
            'dine_type' => $this->dine_type,
            'table_id' => $this->table_id,
            'table' => new DiningTableResource($this->whenLoaded('table')),
            'customer_name' => $this->customer_name,
            'phone' => $this->phone,
            'address' => $this->address,
            'subtotal' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'service_charge_rate' => $this->service_charge_rate,
            'service_charge_amount' => $this->service_charge_amount,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'rounding' => $this->rounding,
            'total' => $this->total,
            'paid_total' => $this->paid_total,
            'balance' => $this->balance,
            'held_at' => $this->held_at,
            'confirmed_at' => $this->confirmed_at,
            'preparing_at' => $this->preparing_at,
            'ready_at' => $this->ready_at,
            'served_at' => $this->served_at,
            'cancelled_at' => $this->cancelled_at,
            'voided_by' => $this->voided_by,
            'void_reason' => $this->void_reason,
            'cashier_id' => $this->cashier_id,
            'shift_id' => $this->shift_id,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at,
        ];
    }
}
