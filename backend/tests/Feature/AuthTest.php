<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\MakesBlogData;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use MakesBlogData, RefreshDatabase;

    public function test_user_can_register_and_gets_a_token(): void
    {
        $res = $this->postJson('/api/register', [
            'name' => 'Анна', 'email' => 'anna@example.test',
            'password' => 'secret123', 'password_confirmation' => 'secret123',
        ]);

        $res->assertCreated()->assertJsonPath('user.role', 'user')->assertJsonStructure(['token']);
        $this->assertDatabaseHas('users', ['email' => 'anna@example.test']);
        $this->assertNotSame('secret123', \App\Models\User::first()->password);   // stored hashed
    }

    public function test_registration_validates_input(): void
    {
        $this->makeUser(['email' => 'taken@example.test']);

        $this->postJson('/api/register', [
            'name' => 'A', 'email' => 'taken@example.test', 'password' => '123', 'password_confirmation' => '456',
        ])->assertStatus(422)->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_cannot_set_the_admin_role(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Hacker', 'email' => 'h@example.test', 'role' => 'admin',
            'password' => 'secret123', 'password_confirmation' => 'secret123',
        ])->assertCreated()->assertJsonPath('user.role', 'user');
    }

    public function test_login_success_and_wrong_password(): void
    {
        $this->makeUser(['email' => 'a@example.test', 'password' => 'secret123']);

        $this->postJson('/api/login', ['email' => 'a@example.test', 'password' => 'secret123'])
            ->assertOk()->assertJsonStructure(['token']);

        $this->postJson('/api/login', ['email' => 'a@example.test', 'password' => 'wrong'])
            ->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_blocked_user_cannot_log_in(): void
    {
        $this->makeUser(['email' => 'b@example.test', 'password' => 'secret123', 'is_blocked' => true]);

        $this->postJson('/api/login', ['email' => 'b@example.test', 'password' => 'secret123'])->assertForbidden();
    }

    public function test_protected_routes_require_a_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/posts', [])->assertUnauthorized();
    }

    public function test_logout_revokes_the_token(): void
    {
        $token = $this->makeUser()->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
