<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        // role and is_blocked are NEVER taken from the request
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),   // hashed by the model cast
            'role' => User::ROLE_USER,
        ]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken('spa')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Неверный email или пароль. Проверьте данные и попробуйте снова.'],
            ]);
        }

        if ($user->is_blocked) {
            return response()->json(['message' => 'Ваша учётная запись заблокирована.'], 403);
        }

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken('spa')->plainTextToken,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Delete only the token that was used for this request
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Вы вышли из аккаунта.']);
    }

    /** Current user + numbers for the personal cabinet header. */
    public function me(Request $request, RecommendationService $recommendations): JsonResponse
    {
        $user = $request->user();

        $myPostIds = Post::where('user_id', $user->id)->pluck('id');
        $profile = $recommendations->profile($user);

        return response()->json([
            'user' => new UserResource($user),
            'stats' => [
                'posts' => Post::where('user_id', $user->id)->published()->count(),
                'likes' => Like::whereIn('post_id', $myPostIds)->count(),
                'comments' => $user->comments()->count(),
            ],
            'interests' => $recommendations->interestLabels($profile, 5),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'email' => ['required', 'string', 'email', 'max:120', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json(['user' => new UserResource($user)]);
    }
}
