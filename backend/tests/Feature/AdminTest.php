<?php

namespace Tests\Feature;

use App\Models\Complaint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesBlogData;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use MakesBlogData, RefreshDatabase;

    public function test_regular_users_and_guests_cannot_use_admin_routes(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();

        Sanctum::actingAs($this->makeUser());
        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/admin/stats')->assertForbidden();
    }

    public function test_admin_can_block_a_user_and_change_a_role(): void
    {
        $target = $this->makeUser();
        $target->createToken('t');
        Sanctum::actingAs($admin = $this->makeAdmin());

        $this->patchJson("/api/admin/users/{$target->id}", ['is_blocked' => true])->assertOk();
        $this->assertTrue($target->fresh()->is_blocked);
        $this->assertCount(0, $target->tokens);   // signed out everywhere

        $this->patchJson("/api/admin/users/{$target->id}", ['role' => 'admin'])->assertOk();
        $this->patchJson("/api/admin/users/{$admin->id}", ['is_blocked' => true])->assertStatus(422);   // not yourself
    }

    public function test_category_crud_and_protection(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $id = $this->postJson('/api/admin/categories', ['name' => 'Data Science'])
            ->assertCreated()->assertJsonPath('data.slug', 'data-science')->json('data.id');
        $this->postJson('/api/admin/categories', ['name' => 'Data Science'])->assertStatus(422);

        $this->makePost($this->makeUser(), ['category_id' => $id]);
        $this->deleteJson("/api/admin/categories/$id")->assertStatus(422);   // has posts
    }

    public function test_complaint_can_hide_the_post_and_is_assigned_to_the_admin(): void
    {
        $post = $this->makePost($this->makeUser());
        $complaint = Complaint::create(['user_id' => $this->makeUser()->id, 'post_id' => $post->id, 'reason' => 'spam']);

        Sanctum::actingAs($admin = $this->makeAdmin());
        $this->patchJson("/api/admin/complaints/{$complaint->id}", [
            'status' => 'resolved', 'resolution' => 'Скрыто', 'hide_post' => true,
        ])->assertOk();

        $this->assertSame('hidden', $post->fresh()->status);
        $this->assertSame($admin->id, $complaint->fresh()->admin_id);
        $this->assertNotNull($complaint->fresh()->resolved_at);

        $this->getJson("/api/posts/{$post->id}")->assertOk();   // admin still sees it
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/posts/{$post->id}")->assertNotFound();   // guests do not
    }

    public function test_dashboard_returns_14_days_of_activity(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/stats')->assertOk()->assertJsonCount(14, 'activity');
    }
}
