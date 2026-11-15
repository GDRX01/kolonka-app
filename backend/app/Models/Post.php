<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Post extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_HIDDEN = 'hidden';   // hidden by a moderator

    public const STATUSES = [self::STATUS_DRAFT, self::STATUS_PUBLISHED, self::STATUS_HIDDEN];

    protected $fillable = [
        'user_id', 'category_id', 'title', 'excerpt', 'cover_path', 'body', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        // Do not leave orphan image files on disk when a post is deleted
        static::deleted(function (Post $post) {
            if ($post->cover_path) {
                Storage::disk('public')->delete($post->cover_path);
            }
        });
    }

    /** URL of the cover photo (relative, served by the API route GET /api/covers/{file}), or null. */
    public function coverUrl(): ?string
    {
        return $this->cover_path ? '/api/covers/'.basename($this->cover_path) : null;
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'post_tag');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('posts.status', self::STATUS_PUBLISHED);
    }

    /**
     * Everything a post "card" needs in one query: author, category, tags,
     * like/comment counters and (if $user is given) whether $user liked it.
     */
    public function scopeCards(Builder $query, ?User $user = null): Builder
    {
        return $query
            ->with(['author:id,name', 'category:id,name,slug', 'tags:id,name,slug'])
            ->withCount(['likes', 'comments'])
            ->when($user, fn (Builder $q) => $q->withExists([
                'likes as liked' => fn ($l) => $l->where('likes.user_id', $user->id),
            ]));
    }
}
