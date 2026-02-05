<?php

namespace App\Services;

use App\Models\ReceiptSequence;
use Illuminate\Support\Facades\DB;

class ReceiptService
{
    public static function nextReceiptNumber(): string
    {
        return DB::transaction(function () {
            $today = now()->toDateString();

            $sequence = ReceiptSequence::query()
                ->where('date', $today)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                $sequence = ReceiptSequence::create([
                    'date' => $today,
                    'last_number' => 0,
                ]);
            }

            $sequence->last_number += 1;
            $sequence->save();

            $number = str_pad((string) $sequence->last_number, 4, '0', STR_PAD_LEFT);

            return 'LIN-' . now()->format('Ymd') . '-' . $number;
        });
    }
}
