<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    /** ?limit=8 shows the top tags; the "show all" button asks for 500. */
    public function index(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->query('limit', 8), 500));

        return response()->json([
            'total' => Tag::count(),
            'data' => Tag::withCount('posts')->orderByDesc('posts_count')->orderBy('name')->limit($limit)->get()
                ->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug, 'posts_count' => $t->posts_count]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = Tag::normalize((string) $request->input('name', ''));
        $slug = Str::slug($name);

        if ($name === '' || $slug === '' || mb_strlen($name) > 30) {
            return response()->json([
                'message' => 'Введите корректное название тега (до 30 символов).',
                'errors' => ['name' => ['Введите корректное название тега (до 30 символов).']],
            ], 422);
        }
        if (Tag::where('slug', $slug)->orWhere('name', $name)->exists()) {
            return response()->json([
                'message' => 'Такой тег уже существует.',
                'errors' => ['name' => ['Такой тег уже существует.']],
            ], 422);
        }

        return response()->json(['data' => Tag::create(['name' => $name, 'slug' => $slug])], 201);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $name = Tag::normalize((string) $request->input('name', ''));
        $slug = Str::slug($name);

        if ($name === '' || $slug === '' || mb_strlen($name) > 30) {
            return response()->json(['message' => 'Введите корректное название тега.', 'errors' => ['name' => ['Введите корректное название тега.']]], 422);
        }
        $exists = Tag::where('id', '!=', $tag->id)->where(fn ($q) => $q->where('slug', $slug)->orWhere('name', $name))->exists();
        if ($exists) {
            return response()->json(['message' => 'Такой тег уже существует.', 'errors' => ['name' => ['Такой тег уже существует.']]], 422);
        }

        $tag->update(['name' => $name, 'slug' => $slug]);

        return response()->json(['data' => $tag]);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();   // links in post_tag are removed by ON DELETE CASCADE

        return response()->json(['message' => 'Тег удалён.']);
    }
}
