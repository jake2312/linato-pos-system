<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class RolesAndUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::findOrCreate('admin', 'sanctum');
        $cashierRole = Role::findOrCreate('cashier', 'sanctum');
        $kitchenRole = Role::findOrCreate('kitchen', 'sanctum');

        $admin = User::updateOrCreate(
            ['email' => 'admin@linato.com'],
            [
                'name' => 'Admin',
                'password' => 'password',
                'pin_hash' => Hash::make('1234'),
                'is_active' => true,
            ]
        );
        $admin->syncRoles([$adminRole]);

        $cashier = User::updateOrCreate(
            ['email' => 'cashier@linato.com'],
            [
                'name' => 'Cashier',
                'password' => 'password',
                'is_active' => true,
            ]
        );
        $cashier->syncRoles([$cashierRole]);

        $kitchen = User::updateOrCreate(
            ['email' => 'kitchen@linato.com'],
            [
                'name' => 'Kitchen',
                'password' => 'password',
                'is_active' => true,
            ]
        );
        $kitchen->syncRoles([$kitchenRole]);
    }
}
