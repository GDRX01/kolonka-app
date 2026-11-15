<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LikeController extends Controller
{
    /** POST /api/posts/{post}/like - press once to like, press again to remove the like. */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        abort_unless($post->status === Post::STATUS_PUBLISHED, 404);

        $userId = $request->user()->id;

        $liked = DB::transaction(function () use ($post, $userId) {
            $deleted = Like::where('user_id', $userId)->where('post_id', $post->id)->delete();

            if ($deleted) {
                return false;
            }

            Like::create(['user_id' => $userId, 'post_id' => $post->id]);

            return true;
        });

        return response()->json([
            'liked' => $liked,
            'likes_count' => Like::where('post_id', $post->id)->count(),
        ]);
    }
}
