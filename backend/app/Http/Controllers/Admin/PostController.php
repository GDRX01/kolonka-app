<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::cards();

        if ($text = trim((string) $request->query('q', ''))) {
            $like = '%'.addcslashes($text, '%_\\').'%';
            $query->where(fn ($w) => $w
                ->where('posts.title', 'like', $like)
                ->orWhereHas('author', fn ($a) => $a->where('name', 'like', $like)));
        }
        if ($category = $request->query('category_id')) {
            $query->where('posts.category_id', (int) $category);
        }
        if (in_array($status = $request->query('status'), Post::STATUSES, true)) {
            $query->where('posts.status', $status);
        }

        match ($request->query('sort')) {
            'old' => $query->orderBy('posts.created_at'),
            'popular' => $query->orderByDesc('likes_count'),
            default => $query->orderByDesc('posts.created_at'),
        };
        $query->orderByDesc('posts.id');

        return PostResource::collection($query->paginate(8)->withQueryString());
    }

    /** PATCH /api/admin/posts/{post}  { status } - publish, hide or return to draft. */
    public function update(Request $request, Post $post): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(Post::STATUSES)]]);

        $post->status = $data['status'];
        if ($post->status === Post::STATUS_PUBLISHED && ! $post->published_at) {
            $post->published_at = now();
        }
        $post->save();

        return response()->json(['message' => 'Статус обновлён.', 'status' => $post->status]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return response()->json(['message' => 'Публикация удалена.']);
    }
}
