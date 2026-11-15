<?php

namespace App\Http\Controllers;

use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    /** GET /api/posts/{post}/comments - top-level comments (10 per page) with their replies. */
    public function index(Post $post)
    {
        abort_unless($post->status === Post::STATUS_PUBLISHED, 404);

        $comments = Comment::where('post_id', $post->id)
            ->whereNull('parent_id')
            ->with([
                'author:id,name',
                'replies' => fn ($q) => $q->orderBy('created_at')->orderBy('id')->with('author:id,name'),
            ])
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(10);

        return CommentResource::collection($comments)->additional([
            'total' => Comment::where('post_id', $post->id)->count(),
        ]);
    }

    /** POST /api/posts/{post}/comments */
    public function store(Request $request, Post $post): JsonResponse
    {
        abort_unless($post->status === Post::STATUS_PUBLISHED, 404);

        $data = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:2000'],
            // a reply must point to a comment of the SAME post
            'parent_id' => ['nullable', 'integer', Rule::exists('comments', 'id')->where('post_id', $post->id)],
        ]);

        // Keep the thread two levels deep: a reply to a reply attaches to the top-level comment
        if (! empty($data['parent_id'])) {
            $parent = Comment::find($data['parent_id']);
            $data['parent_id'] = $parent->parent_id ?? $parent->id;
        }

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
            'parent_id' => $data['parent_id'] ?? null,
            'body' => trim($data['body']),
        ]);

        $comment->load('author:id,name');

        return CommentResource::make($comment)->response()->setStatusCode(201);
    }

    /** DELETE /api/comments/{comment} - own comment or any (admin). */
    public function destroy(Comment $comment): JsonResponse
    {
        Gate::authorize('delete', $comment);
        $comment->delete();   // replies are removed by ON DELETE CASCADE

        return response()->json(['message' => 'Комментарий удалён.']);
    }
}
