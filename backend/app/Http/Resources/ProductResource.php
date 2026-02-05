<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'name' => $this->name,
            'sku' => $this->sku,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'price' => $this->price,
            'cost' => $this->cost,
            'image_path' => $this->image_path,
            'is_active' => $this->is_active,
            'inventory' => new InventoryStockResource($this->whenLoaded('inventoryStock')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
