<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\InventoryStock;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Pasta',
            'Pizza',
            'Salads',
            'Beverages',
            'Desserts',
        ];

        $categoryMap = [];

        foreach ($categories as $name) {
            $category = Category::firstOrCreate(['name' => $name], ['is_active' => true]);
            $categoryMap[$name] = $category->id;
        }

        $products = [
            [
                'name' => 'Spaghetti Bolognese',
                'sku' => 'PA-001',
                'category' => 'Pasta',
                'price' => 280,
                'cost' => 140,
            ],
            [
                'name' => 'Carbonara',
                'sku' => 'PA-002',
                'category' => 'Pasta',
                'price' => 260,
                'cost' => 130,
            ],
            [
                'name' => 'Margherita Pizza',
                'sku' => 'PZ-001',
                'category' => 'Pizza',
                'price' => 350,
                'cost' => 180,
            ],
            [
                'name' => 'Pepperoni Pizza',
                'sku' => 'PZ-002',
                'category' => 'Pizza',
                'price' => 390,
                'cost' => 200,
            ],
            [
                'name' => 'House Salad',
                'sku' => 'SL-001',
                'category' => 'Salads',
                'price' => 180,
                'cost' => 70,
            ],
            [
                'name' => 'Iced Tea',
                'sku' => 'BV-001',
                'category' => 'Beverages',
                'price' => 80,
                'cost' => 20,
            ],
            [
                'name' => 'Latte',
                'sku' => 'BV-002',
                'category' => 'Beverages',
                'price' => 120,
                'cost' => 35,
            ],
            [
                'name' => 'Tiramisu',
                'sku' => 'DS-001',
                'category' => 'Desserts',
                'price' => 160,
                'cost' => 60,
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::updateOrCreate(
                ['sku' => $productData['sku']],
                [
                    'name' => $productData['name'],
                    'category_id' => $categoryMap[$productData['category']],
                    'price' => $productData['price'],
                    'cost' => $productData['cost'],
                    'is_active' => true,
                ]
            );

            InventoryStock::updateOrCreate(
                ['product_id' => $product->id],
                [
                    'current_stock' => 50,
                    'reorder_level' => 10,
                ]
            );
        }
    }
}
