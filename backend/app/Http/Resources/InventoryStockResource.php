<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryStockResource extends JsonResource
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
            'product_id' => $this->product_id,
            'current_stock' => $this->current_stock,
            'reorder_level' => $this->reorder_level,
            'product' => new ProductResource($this->whenLoaded('product')),
            'updated_at' => $this->updated_at,
        ];
    }
}
