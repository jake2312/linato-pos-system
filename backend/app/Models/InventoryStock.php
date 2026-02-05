<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    protected $fillable = [
        'product_id',
        'current_stock',
        'reorder_level',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'reorder_level' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class, 'product_id', 'product_id');
    }
}
