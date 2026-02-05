<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiningTableResource;
use App\Models\DiningTable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    public function index(Request $request)
    {
        $query = DiningTable::query()->orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->boolean('all')) {
            return DiningTableResource::collection($query->get());
        }

        $perPage = (int) $request->get('per_page', 20);

        return DiningTableResource::collection($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:tables,name'],
            'capacity' => ['required', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'max:30'],
        ]);

        $table = DiningTable::create($data);

        return new DiningTableResource($table);
    }

    public function show(DiningTable $table)
    {
        return new DiningTableResource($table);
    }

    public function update(Request $request, DiningTable $table)
    {
        $data = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:80',
                Rule::unique('tables', 'name')->ignore($table->id),
            ],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'status' => ['sometimes', 'string', 'max:30'],
        ]);

        $table->update($data);

        return new DiningTableResource($table);
    }

    public function destroy(DiningTable $table)
    {
        $table->delete();

        return response()->json(['message' => 'Table deleted.']);
    }
}
