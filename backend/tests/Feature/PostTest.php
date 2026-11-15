<?php

namespace Tests\Feature;

use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesBlogData;
use Tests\TestCase;

class PostTest extends TestCase
{
    use MakesBlogData, RefreshDatabase;

    private function payload(array $over = []): array
    {
        return array_merge([
            'title' => 'Новая статья', 'body' => 'Достаточно длинный основной текст статьи.',
            'category_id' => $this->makeCategory()->id, 'tags' => ['#Laravel', 'php'], 'status' => 'published',
        ], $over);
    }

    public function test_guest_sees_only_published_posts(): void
    {
        $author = $this->makeUser();
        $this->makePost($author, ['title' => 'Видимая']);
        $draft = $this->makePost($author, ['title' => 'Черновик', 'status' => 'draft', 'published_at' => null]);

        $this->getJson('/api/posts')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Видимая');
        $this->getJson("/api/posts/{$draft->id}")->assertNotFound();
    }

    public function test_search_filters_by_text_category_and_tags(): void
    {
        $a = $this->makeUser();
        $this->makePost($a, ['title' => 'Про Laravel'], ['laravel', 'php']);
        $this->makePost($a, ['title' => 'Про React', 'category_id' => $this->makeCategory('Дизайн')->id], ['react']);

        $this->getJson('/api/posts?q=react')->assertJsonCount(1, 'data');
        $this->getJson('/api/posts?category=dizain')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Про React');
        $this->getJson('/api/posts?tags=laravel,php')->assertJsonCount(1, 'data');
        $this->getJson('/api/posts?tags=laravel,react')->assertJsonCount(0, 'data');
    }

    public function test_user_creates_post_with_tags(): void
    {
        $user = $this->makeUser();
        Sanctum::actingAs($user);

        $this->postJson('/api/posts', $this->payload())->assertCreated()->assertJsonPath('data.status', 'published');

        $post = Post::first();
        $this->assertSame($user->id, $post->user_id);
        $this->assertEqualsCanonicalizing(['laravel', 'php'], $post->tags->pluck('name')->all());
        $this->assertNotNull($post->published_at);
    }

    public function test_validation_errors_on_create(): void
    {
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/posts', ['title' => 'x', 'status' => 'published'])
            ->assertStatus(422)->assertJsonValidationErrors(['title', 'body', 'category_id']);
        $this->postJson('/api/posts', $this->payload(['category_id' => 9999]))
            ->assertStatus(422)->assertJsonValidationErrors(['category_id']);
    }

    public function test_only_the_owner_or_an_admin_can_edit_and_delete(): void
    {
        $owner = $this->makeUser();
        $post = $this->makePost($owner);

        Sanctum::actingAs($this->makeUser());
        $this->putJson("/api/posts/{$post->id}", $this->payload())->assertForbidden();
        $this->deleteJson("/api/posts/{$post->id}")->assertForbidden();

        Sanctum::actingAs($owner);
        $this->putJson("/api/posts/{$post->id}", $this->payload(['title' => 'Изменено']))->assertOk();
        $this->assertSame('Изменено', $post->fresh()->title);

        Sanctum::actingAs($this->makeAdmin());
        $this->deleteJson("/api/posts/{$post->id}")->assertOk();
        $this->assertModelMissing($post);
    }

    public function test_hidden_post_cannot_be_republished_by_its_author(): void
    {
        $owner = $this->makeUser();
        $post = $this->makePost($owner, ['status' => 'hidden']);

        Sanctum::actingAs($owner);
        $this->putJson("/api/posts/{$post->id}", $this->payload(['status' => 'published']))->assertOk();

        $this->assertSame('hidden', $post->fresh()->status);
    }
}
