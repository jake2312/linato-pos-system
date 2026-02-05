<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptSequence extends Model
{
    protected $fillable = [
        'date',
        'last_number',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
