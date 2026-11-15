<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ComplaintController extends Controller
{
    /** POST /api/posts/{post}/complaints */
    public function store(Request $request, Post $post): JsonResponse
    {
        abort_unless($post->status === Post::STATUS_PUBLISHED, 404);

        $data = $request->validate([
            'reason' => ['required', Rule::in(array_keys(Complaint::REASONS))],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        $alreadyOpen = Complaint::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->whereIn('status', [Complaint::STATUS_NEW, Complaint::STATUS_IN_REVIEW])
            ->exists();

        if ($alreadyOpen) {
            return response()->json([
                'message' => 'Вы уже отправили жалобу на эту публикацию. Мы её рассматриваем.',
            ], 422);
        }

        Complaint::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
            'reason' => $data['reason'],
            'details' => $data['details'] ?? null,
            'status' => Complaint::STATUS_NEW,
        ]);

        return response()->json(['message' => 'Спасибо! Жалоба отправлена модераторам.'], 201);
    }
}
