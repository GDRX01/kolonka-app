<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::withCount('posts');

        if ($text = trim((string) $request->query('q', ''))) {
            $like = '%'.addcslashes($text, '%_\\').'%';
            $query->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like));
        }
        if (in_array($role = $request->query('role'), [User::ROLE_USER, User::ROLE_ADMIN], true)) {
            $query->where('role', $role);
        }
        match ($request->query('status')) {
            'active' => $query->where('is_blocked', false),
            'blocked' => $query->where('is_blocked', true),
            default => null,
        };
        match ($request->query('sort')) {
            'old' => $query->orderBy('created_at'),
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('created_at'),
        };
        $query->orderByDesc('id');

        return UserResource::collection($query->paginate(8)->withQueryString());
    }

    /** PATCH /api/admin/users/{user}  { role?, is_blocked? } */
    public function update(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Нельзя изменить собственную учётную запись.'], 422);
        }

        $data = $request->validate([
            'role' => ['sometimes', Rule::in([User::ROLE_USER, User::ROLE_ADMIN])],
            'is_blocked' => ['sometimes', 'boolean'],
        ]);

        $user->update($data);

        if ($user->is_blocked) {
            $user->tokens()->delete();   // sign the user out everywhere
        }

        return response()->json(['user' => new UserResource($user)]);
    }
}
