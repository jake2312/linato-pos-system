<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use Illuminate\Database\Seeder;

class TableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tables = [
            ['name' => 'T1', 'capacity' => 2],
            ['name' => 'T2', 'capacity' => 4],
            ['name' => 'T3', 'capacity' => 4],
            ['name' => 'T4', 'capacity' => 6],
            ['name' => 'T5', 'capacity' => 2],
        ];

        foreach ($tables as $table) {
            DiningTable::updateOrCreate(
                ['name' => $table['name']],
                [
                    'capacity' => $table['capacity'],
                    'status' => 'available',
                ]
            );
        }
    }
}
