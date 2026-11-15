<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaxonomyController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json(['data' => Category::orderBy('name')->get(['id', 'name', 'slug'])]);
    }

    /** ?q=lar&limit=20 - used by the tag filter and the editor autocomplete. */
    public function tags(Request $request): JsonResponse
    {
        $query = Tag::withCount(['posts' => fn ($q) => $q->where('posts.status', Post::STATUS_PUBLISHED)]);

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where('name', 'like', '%'.addcslashes(ltrim($q, '#'), '%_\\').'%');
        }

        $tags = $query->orderByDesc('posts_count')->orderBy('name')
            ->limit(max(1, min((int) $request->query('limit', 30), 100)))->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug, 'posts_count' => $t->posts_count]);

        return response()->json(['data' => $tags]);
    }
}
