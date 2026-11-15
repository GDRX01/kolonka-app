<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostRequest;
use App\Http\Resources\PostResource;
use App\Models\Like;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class PostController extends Controller
{
    /** GET /api/posts - public search / filter / sort / pagination. */
    public function index(Request $request)
    {
        $user = $request->user('sanctum');
        $query = Post::cards($user)->published();

        if ($text = trim((string) $request->query('q', ''))) {
            $like = '%'.addcslashes($text, '%_\\').'%';
            $query->where(fn ($w) => $w
                ->where('posts.title', 'like', $like)
                ->orWhere('posts.excerpt', 'like', $like)
                ->orWhere('posts.body', 'like', $like));
        }

        if ($category = $request->query('category')) {
            $query->whereHas('category', fn ($c) => $c->where('slug', $category));
        }

        if ($author = (int) $request->query('author')) {
            $query->where('posts.user_id', $author);
        }

        // ?tags=laravel,mysql -> the post must have ALL of them
        foreach (array_filter(explode(',', (string) $request->query('tags', ''))) as $slug) {
            $query->whereHas('tags', fn ($t) => $t->where('tags.slug', $slug));
        }

        $since = match ($request->query('period')) {
            'week' => now()->subWeek(),
            'month' => now()->subMonth(),
            'year' => now()->subYear(),
            default => null,
        };
        if ($since) {
            $query->where('posts.published_at', '>=', $since);
        }

        if ($request->query('sort') === 'popular') {
            $query->orderByDesc('likes_count');
        }
        $query->orderByDesc('posts.published_at')->orderByDesc('posts.id');

        $perPage = max(1, min((int) $request->query('per_page', 9), 24));

        return PostResource::collection($query->paginate($perPage)->withQueryString());
    }

    /** GET /api/posts/{id} - one article with similar posts. */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user('sanctum');
        $post = Post::cards($user)->findOrFail($id);

        $isOwnerOrAdmin = $user && ($user->isAdmin() || $user->id === $post->user_id);
        if ($post->status !== Post::STATUS_PUBLISHED && ! $isOwnerOrAdmin) {
            abort(404);   // drafts and hidden posts do not exist for everyone else
        }

        $tagIds = $post->tags->pluck('id')->all();
        $related = Post::cards($user)->published()
            ->where('posts.id', '!=', $post->id)
            ->where(fn ($q) => $q
                ->where('posts.category_id', $post->category_id)
                ->orWhereHas('tags', fn ($t) => $t->whereIn('tags.id', $tagIds ?: [0])))
            ->orderByDesc('likes_count')
            ->limit(3)
            ->get();

        $authorPostIds = Post::where('user_id', $post->user_id)->published()->pluck('id');

        return response()->json([
            'data' => PostResource::make($post)->withBody()->resolve(),
            'related' => PostResource::collection($related)->resolve(),
            'author_stats' => [
                'posts' => $authorPostIds->count(),
                'likes' => Like::whereIn('post_id', $authorPostIds)->count(),
            ],
        ]);
    }

    /** GET /api/my/posts - the cabinet table (own posts, any status). */
    public function mine(Request $request)
    {
        $user = $request->user();
        $base = Post::where('user_id', $user->id);

        $query = Post::cards($user)->where('posts.user_id', $user->id);
        if (in_array($status = $request->query('status'), Post::STATUSES, true)) {
            $query->where('posts.status', $status);
        }
        $query->orderByDesc('posts.created_at')->orderByDesc('posts.id');

        $perPage = max(1, min((int) $request->query('per_page', 5), 20));

        return PostResource::collection($query->paginate($perPage)->withQueryString())->additional([
            'counts' => [
                'all' => (clone $base)->count(),
                'published' => (clone $base)->where('status', Post::STATUS_PUBLISHED)->count(),
                'draft' => (clone $base)->where('status', Post::STATUS_DRAFT)->count(),
            ],
        ]);
    }

    /** GET /api/my/posts/{post} - data for the editor. */
    public function edit(Request $request, Post $post)
    {
        Gate::authorize('update', $post);

        $post = Post::cards($request->user())->findOrFail($post->id);

        return PostResource::make($post)->withBody();
    }

    /** POST /api/posts */
    public function store(PostRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $post = DB::transaction(function () use ($data, $user) {
            $post = Post::create([
                'user_id' => $user->id,
                'category_id' => $data['category_id'],
                'title' => $data['title'],
                'excerpt' => $data['excerpt'] ?? null,
                'body' => $data['body'],
                'status' => $data['status'],
                'published_at' => $data['status'] === Post::STATUS_PUBLISHED ? now() : null,
            ]);
            $this->syncTags($post, $data['tags'] ?? []);

            return $post;
        });

        return PostResource::make(Post::cards($user)->findOrFail($post->id))
            ->withBody()->response()->setStatusCode(201);
    }

    /** PUT /api/posts/{post} */
    public function update(PostRequest $request, Post $post)
    {
        Gate::authorize('update', $post);

        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($data, $post, $user) {
            // A post hidden by a moderator stays hidden until an admin restores it
            $status = ($post->status === Post::STATUS_HIDDEN && ! $user->isAdmin())
                ? Post::STATUS_HIDDEN
                : $data['status'];

            $post->fill([
                'category_id' => $data['category_id'],
                'title' => $data['title'],
                'excerpt' => $data['excerpt'] ?? null,
                'body' => $data['body'],
                'status' => $status,
            ]);

            if ($status === Post::STATUS_PUBLISHED && ! $post->published_at) {
                $post->published_at = now();
            }

            $post->save();
            $this->syncTags($post, $data['tags'] ?? []);
        });

        return PostResource::make(Post::cards($user)->findOrFail($post->id))->withBody();
    }

    /** DELETE /api/posts/{post} */
    public function destroy(Post $post): JsonResponse
    {
        Gate::authorize('delete', $post);
        $post->delete();   // comments, likes, tag links, complaints go away via ON DELETE CASCADE

        return response()->json(['message' => 'Публикация удалена.']);
    }

    /** Create missing tags and attach exactly the given ones to the post. */
    private function syncTags(Post $post, array $names): void
    {
        $ids = collect($names)
            ->map(fn ($n) => Tag::normalize((string) $n))
            ->filter(fn ($n) => $n !== '' && Str::slug($n) !== '')
            ->unique()
            ->take(5)
            ->map(fn ($name) => Tag::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name])->id)
            ->unique()
            ->values()
            ->all();

        $post->tags()->sync($ids);
    }
}
