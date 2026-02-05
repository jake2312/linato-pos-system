<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryStockResource;
use App\Http\Resources\StockMovementResource;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function stocks(Request $request)
    {
        $query = InventoryStock::query()
            ->with('product')
            ->orderBy('updated_at', 'desc');

        if ($request->filled('q')) {
            $term = $request->get('q');
            $query->whereHas('product', function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('sku', 'like', "%{$term}%");
            });
        }

        $perPage = (int) $request->get('per_page', 30);

        return InventoryStockResource::collection($query->paginate($perPage));
    }

    public function lowStock()
    {
        $stocks = InventoryStock::query()
            ->with('product')
            ->whereColumn('current_stock', '<=', 'reorder_level')
            ->orderBy('current_stock')
            ->get();

        return InventoryStockResource::collection($stocks);
    }

    public function updateStock(Request $request, Product $product)
    {
        $data = $request->validate([
            'current_stock' => ['required', 'integer'],
            'reorder_level' => ['required', 'integer'],
        ]);

        $stock = InventoryStock::updateOrCreate(
            ['product_id' => $product->id],
            $data
        );

        return new InventoryStockResource($stock->load('product'));
    }

    public function adjust(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'type' => ['required', Rule::in(['adjustment', 'restock'])],
            'quantity' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $movement = DB::transaction(function () use ($data, $request) {
            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['current_stock' => 0, 'reorder_level' => 0]
            );

            $before = $stock->current_stock;
            $after = $before + $data['quantity'];

            $stock->update(['current_stock' => $after]);

            return StockMovement::create([
                'product_id' => $data['product_id'],
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'before_stock' => $before,
                'after_stock' => $after,
                'reference_type' => 'manual',
                'reference_id' => null,
                'user_id' => $request->user()->id,
                'notes' => $data['notes'] ?? null,
            ]);
        });

        return new StockMovementResource($movement);
    }

    public function movements(Request $request)
    {
        $query = StockMovement::query()->orderByDesc('created_at');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->get('product_id'));
        }

        $perPage = (int) $request->get('per_page', 30);

        return StockMovementResource::collection($query->paginate($perPage));
    }
}
