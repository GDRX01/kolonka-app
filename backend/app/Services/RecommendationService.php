<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Personalised recommendations (section 4.4, item 5 of the technical spec):
 *
 *  1. take the posts the user has liked;
 *  2. collect their categories and tags;
 *  3. find OTHER published posts that share those categories / tags;
 *  4. score = (1 if the category matches) + (number of matching tags);
 *  5. sort by score DESC, then newest first;
 *  6. if nothing matches (or the user has no likes) -> show the latest posts.
 */
class RecommendationService
{
    /** @return array{category_ids: array<int>, tag_ids: array<int>, liked_ids: array<int>} */
    public function profile(User $user): array
    {
        $likedIds = $user->likes()->pluck('post_id')->map(fn ($i) => (int) $i)->all();

        if (! $likedIds) {
            return ['category_ids' => [], 'tag_ids' => [], 'liked_ids' => []];
        }

        return [
            'category_ids' => Post::whereIn('id', $likedIds)->pluck('category_id')
                ->unique()->map(fn ($i) => (int) $i)->values()->all(),
            'tag_ids' => DB::table('post_tag')->whereIn('post_id', $likedIds)->pluck('tag_id')
                ->unique()->map(fn ($i) => (int) $i)->values()->all(),
            'liked_ids' => $likedIds,
        ];
    }

    /** Human readable interests ("Разработка", "#react") for the UI subtitle. */
    public function interestLabels(array $profile, int $limit = 4): array
    {
        $labels = Category::whereIn('id', $profile['category_ids'])->limit(2)->pluck('name')->all();
        $tags = Tag::whereIn('id', $profile['tag_ids'])->limit($limit)->pluck('name')
            ->map(fn ($n) => '#'.$n)->all();

        return array_slice(array_merge($labels, $tags), 0, $limit);
    }

    /**
     * @return array{posts: Collection, personalized: bool, interests: array<string>}
     */
    public function forUser(?User $user, int $limit = 6): array
    {
        // Guests: no history -> popular posts
        if (! $user) {
            return ['posts' => $this->popular(null, $limit), 'personalized' => false, 'interests' => []];
        }

        $profile = $this->profile($user);
        $picked = collect();

        if ($profile['liked_ids']) {
            // ids come from the database and are cast to int above, so inlining them is safe
            $cats = implode(',', $profile['category_ids']) ?: '0';
            $tags = implode(',', $profile['tag_ids']) ?: '0';
            $score = "(CASE WHEN posts.category_id IN ($cats) THEN 1 ELSE 0 END"
                ." + (SELECT COUNT(*) FROM post_tag WHERE post_tag.post_id = posts.id AND post_tag.tag_id IN ($tags)))";

            $picked = Post::cards($user)->published()
                ->whereNotIn('posts.id', $profile['liked_ids'])   // already liked
                ->where('posts.user_id', '!=', $user->id)          // not my own articles
                ->whereRaw("$score > 0")
                ->orderByRaw("$score DESC")
                ->orderByDesc('posts.published_at')               // tie-break: newer first
                ->limit($limit)
                ->get();
        }

        $personalized = $picked->isNotEmpty();

        // Fill the remaining slots (or everything, if nothing matched) with the latest posts
        if ($picked->count() < $limit) {
            $exclude = array_merge($profile['liked_ids'], $picked->pluck('id')->all());
            $latest = Post::cards($user)->published()
                ->whereNotIn('posts.id', $exclude)
                ->orderByDesc('posts.published_at')
                ->limit($limit - $picked->count())
                ->get();
            $picked = $picked->concat($latest)->values();
        }

        return [
            'posts' => $picked,
            'personalized' => $personalized,
            'interests' => $personalized ? $this->interestLabels($profile) : [],
        ];
    }

    public function popular(?User $user, int $limit = 6): Collection
    {
        return Post::cards($user)->published()
            ->orderByDesc('likes_count')
            ->orderByDesc('posts.published_at')
            ->limit($limit)
            ->get();
    }
}
