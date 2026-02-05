<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashierShiftResource extends JsonResource
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
            'user_id' => $this->user_id,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'opening_cash' => $this->opening_cash,
            'closing_cash' => $this->closing_cash,
            'expected_cash' => $this->expected_cash,
            'discrepancy' => $this->discrepancy,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
