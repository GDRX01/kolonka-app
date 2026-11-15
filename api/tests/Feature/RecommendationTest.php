<?php

namespace Tests\Feature;

use App\Models\Like;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesBlogData;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use MakesBlogData, RefreshDatabase;

    public function test_posts_are_ranked_by_matching_category_and_tags(): void
    {
        $author = $this->makeUser();
        $reader = $this->makeUser();
        $dev = $this->makeCategory('Разработка');
        $design = $this->makeCategory('Дизайн');

        $liked = $this->makePost($author, ['title' => 'Liked', 'category_id' => $dev->id], ['laravel', 'mysql']);
        Like::create(['user_id' => $reader->id, 'post_id' => $liked->id]);

        $best = $this->makePost($author, ['title' => 'Best', 'category_id' => $dev->id, 'published_at' => now()->subDays(5)], ['laravel', 'mysql']); // 1+2
        $mid = $this->makePost($author, ['title' => 'Mid', 'category_id' => $design->id, 'published_at' => now()->subDay()], ['laravel']);          // 0+1
        $low = $this->makePost($author, ['title' => 'Low', 'category_id' => $dev->id, 'published_at' => now()->subDays(9)], ['css']);              // 1+0
        $this->makePost($author, ['title' => 'Unrelated', 'category_id' => $design->id], ['css']);                                                  // 0

        Sanctum::actingAs($reader);
        $res = $this->getJson('/api/recommendations?limit=3')->assertOk()->assertJsonPath('personalized', true);

        // score 3, then the two score-1 posts with the NEWER one first
        $this->assertSame(['Best', 'Mid', 'Low'], collect($res->json('data'))->pluck('title')->all());
    }

    public function test_already_liked_and_own_posts_are_not_recommended(): void
    {
        $author = $this->makeUser();
        $reader = $this->makeUser();
        $liked = $this->makePost($author, ['title' => 'Liked'], ['laravel']);
        Like::create(['user_id' => $reader->id, 'post_id' => $liked->id]);
        $this->makePost($reader, ['title' => 'Mine'], ['laravel']);

        Sanctum::actingAs($reader);
        $titles = collect($this->getJson('/api/recommendations')->json('data'))->pluck('title');

        $this->assertNotContains('Liked', $titles);
        $this->assertNotContains('Mine', $titles);
    }

    public function test_user_without_likes_and_guests_get_fallback_lists(): void
    {
        $author = $this->makeUser();
        $this->makePost($author, ['title' => 'Old', 'published_at' => now()->subDays(3)]);
        $this->makePost($author, ['title' => 'New', 'published_at' => now()]);

        Sanctum::actingAs($this->makeUser());
        $this->getJson('/api/recommendations')->assertOk()
            ->assertJsonPath('personalized', false)->assertJsonPath('data.0.title', 'New');

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/recommendations')->assertOk()->assertJsonPath('personalized', false);
    }
}
