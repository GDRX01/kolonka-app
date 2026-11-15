<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PostResource extends JsonResource
{
    protected bool $withBody = false;

    /** Include the full Markdown text (article page and editor only). */
    public function withBody(): static
    {
        $this->withBody = true;

        return $this;
    }

    public function toArray(Request $request): array
    {
        $body = (string) $this->body;
        $words = preg_match_all('/[\p{L}\p{N}]+/u', $body);

        $excerpt = $this->excerpt;
        if (! $excerpt) {
            $plain = trim(preg_replace('/\s+/u', ' ', preg_replace('/[#*_>`\[\]()!\-]+/u', ' ', $body)));
            $excerpt = Str::limit($plain, 180);
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'excerpt' => $excerpt,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'read_minutes' => max(1, (int) ceil($words / 200)),
            // Uploaded photo (or null). When null the frontend draws one of 7 gradients,
            // chosen by this number, so every post always has a cover.
            'cover_url' => $this->coverUrl(),
            'cover' => ((int) $this->category_id) % 7,
            'category_id' => $this->category_id,
            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ]),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
            ])->values()),
            'likes_count' => $this->whenCounted('likes'),
            'comments_count' => $this->whenCounted('comments'),
            'liked' => (bool) ($this->liked ?? false),
            'body' => $this->when($this->withBody, $body),
            'excerpt_raw' => $this->when($this->withBody, $this->excerpt),
        ];
    }
}
