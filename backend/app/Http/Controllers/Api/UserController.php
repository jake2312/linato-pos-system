<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('roles')->orderBy('name');

        if ($request->filled('role')) {
            $query->role($request->get('role'));
        }

        $perPage = (int) $request->get('per_page', 20);

        return UserResource::collection($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string'],
            'pin' => ['nullable', 'string', 'min:4', 'max:8'],
            'is_active' => ['boolean'],
        ]);

        $role = Role::findByName($data['role'], 'sanctum');

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'pin_hash' => isset($data['pin']) ? Hash::make($data['pin']) : null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $user->assignRole($role);

        return new UserResource($user->load('roles'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        if (!empty($data['role'])) {
            $role = Role::findByName($data['role'], 'sanctum');
            $user->syncRoles([$role]);
        }

        return new UserResource($user->load('roles'));
    }

    public function updatePin(Request $request, User $user)
    {
        $data = $request->validate([
            'pin' => ['required', 'string', 'min:4', 'max:8'],
        ]);

        $user->update([
            'pin_hash' => Hash::make($data['pin']),
        ]);

        return response()->json(['message' => 'PIN updated.']);
    }
}
