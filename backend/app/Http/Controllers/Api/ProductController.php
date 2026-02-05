<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\InventoryStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with(['category', 'inventoryStock'])
            ->orderBy('name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('q')) {
            $term = $request->get('q');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('sku', 'like', "%{$term}%");
            });
        }

        if ($request->boolean('all')) {
            return ProductResource::collection($query->get());
        }

        $perPage = (int) $request->get('per_page', 30);

        return ProductResource::collection($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'sku' => ['required', 'string', 'max:80', 'unique:products,sku'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'current_stock' => ['nullable', 'integer'],
            'reorder_level' => ['nullable', 'integer'],
        ]);

        $product = Product::create($data);

        InventoryStock::updateOrCreate(
            ['product_id' => $product->id],
            [
                'current_stock' => $data['current_stock'] ?? 0,
                'reorder_level' => $data['reorder_level'] ?? 0,
            ]
        );

        return new ProductResource($product->load(['category', 'inventoryStock']));
    }

    public function show(Product $product)
    {
        return new ProductResource($product->load(['category', 'inventoryStock']));
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:80',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'current_stock' => ['nullable', 'integer'],
            'reorder_level' => ['nullable', 'integer'],
        ]);

        $product->update($data);

        if (array_key_exists('current_stock', $data) || array_key_exists('reorder_level', $data)) {
            InventoryStock::updateOrCreate(
                ['product_id' => $product->id],
                [
                    'current_stock' => $data['current_stock'] ?? $product->inventoryStock?->current_stock ?? 0,
                    'reorder_level' => $data['reorder_level'] ?? $product->inventoryStock?->reorder_level ?? 0,
                ]
            );
        }

        return new ProductResource($product->load(['category', 'inventoryStock']));
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }
}
