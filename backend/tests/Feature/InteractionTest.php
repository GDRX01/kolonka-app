<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesBlogData;
use Tests\TestCase;

class InteractionTest extends TestCase
{
    use MakesBlogData, RefreshDatabase;

    public function test_like_is_a_toggle_and_needs_auth(): void
    {
        $post = $this->makePost($this->makeUser());

        $this->postJson("/api/posts/{$post->id}/like")->assertUnauthorized();

        Sanctum::actingAs($this->makeUser());
        $this->postJson("/api/posts/{$post->id}/like")->assertOk()->assertJson(['liked' => true, 'likes_count' => 1]);
        $this->postJson("/api/posts/{$post->id}/like")->assertOk()->assertJson(['liked' => false, 'likes_count' => 0]);
    }

    public function test_comment_and_reply(): void
    {
        $post = $this->makePost($this->makeUser());
        Sanctum::actingAs($me = $this->makeUser());

        $parent = $this->postJson("/api/posts/{$post->id}/comments", ['body' => 'Привет'])->assertCreated()->json('data.id');
        $this->postJson("/api/posts/{$post->id}/comments", ['body' => 'Ответ', 'parent_id' => $parent])->assertCreated();
        $this->postJson("/api/posts/{$post->id}/comments", ['body' => ''])->assertStatus(422);

        $this->getJson("/api/posts/{$post->id}/comments")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonCount(1, 'data.0.replies');
    }

    public function test_reply_must_belong_to_the_same_post(): void
    {
        $a = $this->makePost($this->makeUser());
        $b = $this->makePost($this->makeUser());
        Sanctum::actingAs($this->makeUser());

        $foreign = $this->postJson("/api/posts/{$a->id}/comments", ['body' => 'x'])->json('data.id');
        $this->postJson("/api/posts/{$b->id}/comments", ['body' => 'y', 'parent_id' => $foreign])
            ->assertStatus(422)->assertJsonValidationErrors(['parent_id']);
    }

    public function test_only_author_or_admin_deletes_a_comment(): void
    {
        $post = $this->makePost($this->makeUser());
        Sanctum::actingAs($author = $this->makeUser());
        $id = $this->postJson("/api/posts/{$post->id}/comments", ['body' => 'мой'])->json('data.id');

        Sanctum::actingAs($this->makeUser());
        $this->deleteJson("/api/comments/$id")->assertForbidden();

        Sanctum::actingAs($this->makeAdmin());
        $this->deleteJson("/api/comments/$id")->assertOk();
    }

    public function test_complaint_is_created_once_while_open(): void
    {
        $post = $this->makePost($this->makeUser());
        Sanctum::actingAs($this->makeUser());

        $this->postJson("/api/posts/{$post->id}/complaints", ['reason' => 'spam'])->assertCreated();
        $this->postJson("/api/posts/{$post->id}/complaints", ['reason' => 'spam'])->assertStatus(422);
        $this->postJson("/api/posts/{$post->id}/complaints", ['reason' => 'nonsense'])->assertStatus(422);
        $this->assertDatabaseCount('complaints', 1);
    }
}
