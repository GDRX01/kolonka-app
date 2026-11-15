<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesBlogData;
use Tests\TestCase;

/** Needs the PHP "gd" extension (UploadedFile::fake()->image() draws a real picture). */
class CoverTest extends TestCase
{
    use MakesBlogData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');   // files go to a temporary folder, never to storage/app/public
    }

    public function test_author_uploads_a_cover_and_it_is_shown_in_the_api(): void
    {
        $owner = $this->makeUser();
        $post = $this->makePost($owner);
        Sanctum::actingAs($owner);

        $res = $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->image('photo.jpg', 1200, 630)], ['Accept' => 'application/json']);

        $res->assertOk();
        $path = $post->fresh()->cover_path;
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
        $url = '/api/covers/'.basename($path);
        $res->assertJsonPath('cover_url', $url);

        $this->getJson("/api/posts/{$post->id}")->assertJsonPath('data.cover_url', $url);

        // the browser can really download it - no storage:link needed
        $this->get($url)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_cover_files_are_served_only_by_exact_existing_name(): void
    {
        $this->get('/api/covers/missing.jpg')->assertNotFound();
        $this->get('/api/covers/script.php')->assertNotFound();      // wrong extension
        $this->get('/api/covers/..%2F..%2F.env')->assertNotFound();  // path traversal attempt
    }

    public function test_png_is_accepted_and_replacing_deletes_the_old_file(): void
    {
        $owner = $this->makeUser();
        $post = $this->makePost($owner);
        Sanctum::actingAs($owner);

        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->image('a.jpg')], ['Accept' => 'application/json'])->assertOk();
        $old = $post->fresh()->cover_path;

        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->image('b.png')], ['Accept' => 'application/json'])->assertOk();

        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($post->fresh()->cover_path);
    }

    public function test_invalid_files_are_rejected(): void
    {
        $owner = $this->makeUser();
        $post = $this->makePost($owner);
        Sanctum::actingAs($owner);
        $h = ['Accept' => 'application/json'];

        // not an image
        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')], $h)
            ->assertStatus(422)->assertJsonValidationErrors(['cover']);
        // a script renamed to .jpg
        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->createWithContent('evil.jpg', '<?php echo 1;')], $h)
            ->assertStatus(422)->assertJsonValidationErrors(['cover']);
        // bigger than 5 MB
        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->image('big.jpg')->size(6000)], $h)
            ->assertStatus(422)->assertJsonValidationErrors(['cover']);
        // missing
        $this->post("/api/posts/{$post->id}/cover", [], $h)->assertStatus(422)->assertJsonValidationErrors(['cover']);

        $this->assertNull($post->fresh()->cover_path);
    }

    public function test_only_author_or_admin_can_change_a_cover(): void
    {
        $post = $this->makePost($this->makeUser());
        $file = fn () => ['cover' => UploadedFile::fake()->image('x.jpg')];
        $h = ['Accept' => 'application/json'];

        $this->post("/api/posts/{$post->id}/cover", $file(), $h)->assertUnauthorized();

        Sanctum::actingAs($this->makeUser());
        $this->post("/api/posts/{$post->id}/cover", $file(), $h)->assertForbidden();
        $this->deleteJson("/api/posts/{$post->id}/cover")->assertForbidden();

        Sanctum::actingAs($this->makeAdmin());
        $this->post("/api/posts/{$post->id}/cover", $file(), $h)->assertOk();
    }

    public function test_removing_the_cover_and_deleting_the_post_clean_up_files(): void
    {
        $owner = $this->makeUser();
        $post = $this->makePost($owner);
        Sanctum::actingAs($owner);
        $h = ['Accept' => 'application/json'];

        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->image('a.jpg')], $h)->assertOk();
        $first = $post->fresh()->cover_path;

        $this->deleteJson("/api/posts/{$post->id}/cover")->assertOk()->assertJsonPath('cover_url', null);
        Storage::disk('public')->assertMissing($first);
        $this->assertNull($post->fresh()->cover_path);

        $this->post("/api/posts/{$post->id}/cover", ['cover' => UploadedFile::fake()->image('b.jpg')], $h)->assertOk();
        $second = $post->fresh()->cover_path;
        $this->deleteJson("/api/posts/{$post->id}")->assertOk();
        Storage::disk('public')->assertMissing($second);
    }
}
