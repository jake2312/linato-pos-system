<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_PREPARING = 'preparing';
    public const STATUS_READY = 'ready';
    public const STATUS_SERVED = 'served';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'receipt_number',
        'status',
        'dine_type',
        'table_id',
        'customer_name',
        'phone',
        'address',
        'subtotal',
        'discount_amount',
        'service_charge_rate',
        'service_charge_amount',
        'tax_rate',
        'tax_amount',
        'rounding',
        'total',
        'paid_total',
        'balance',
        'held_at',
        'confirmed_at',
        'preparing_at',
        'ready_at',
        'served_at',
        'cancelled_at',
        'voided_by',
        'void_reason',
        'cashier_id',
        'shift_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
        'service_charge_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'rounding' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_total' => 'decimal:2',
        'balance' => 'decimal:2',
        'held_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'preparing_at' => 'datetime',
        'ready_at' => 'datetime',
        'served_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function table()
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function shift()
    {
        return $this->belongsTo(CashierShift::class, 'shift_id');
    }
}
