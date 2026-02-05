<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'name_snapshot' => $this->name_snapshot,
            'price' => $this->price,
            'qty' => $this->qty,
            'discount_amount' => $this->discount_amount,
            'notes' => $this->notes,
            'line_total' => $this->line_total,
        ];
    }
}
