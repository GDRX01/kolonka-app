<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Category::withCount('posts')->orderBy('id')->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'posts_count' => $c->posts_count]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:2', 'max:60', 'unique:categories,name']]);

        $category = Category::create(['name' => $data['name'], 'slug' => $this->uniqueSlug($data['name'])]);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60', Rule::unique('categories', 'name')->ignore($category->id)],
        ]);

        $category->update(['name' => $data['name'], 'slug' => $this->uniqueSlug($data['name'], $category->id)]);

        return response()->json(['data' => $category]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->posts()->exists()) {
            return response()->json(['message' => 'Нельзя удалить категорию, в которой есть публикации.'], 422);
        }
        $category->delete();

        return response()->json(['message' => 'Категория удалена.']);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $i = 2;

        while (Category::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
