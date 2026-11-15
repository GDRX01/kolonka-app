<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Everything the home page needs except the paged "latest" list and recommendations. */
class HomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $popular = Post::cards($user)->published()
            ->orderByDesc('likes_count')->orderByDesc('posts.published_at')
            ->limit(5)->get();

        $tags = Tag::withCount(['posts' => fn ($q) => $q->where('posts.status', Post::STATUS_PUBLISHED)])
            ->orderByDesc('posts_count')->orderBy('name')
            ->limit(10)->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug, 'posts_count' => $t->posts_count]);

        $categories = Category::withCount(['posts' => fn ($q) => $q->where('posts.status', Post::STATUS_PUBLISHED)])
            ->orderBy('name')->get()
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'posts_count' => $c->posts_count]);

        return response()->json([
            'featured' => $popular->first() ? PostResource::make($popular->first())->resolve() : null,
            'popular' => PostResource::collection($popular)->resolve(),
            'tags' => $tags,
            'categories' => $categories,
            'stats' => [
                'posts' => Post::published()->count(),
                'authors' => Post::published()->distinct()->count('user_id'),
                'categories' => Category::count(),
            ],
        ]);
    }
}
