<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiningTable extends Model
{
    protected $table = 'tables';

    protected $fillable = [
        'name',
        'capacity',
        'status',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}
