<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'name_snapshot',
        'price',
        'qty',
        'discount_amount',
        'notes',
        'line_total',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'qty' => 'integer',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
