<?php

namespace Tests\Concerns;

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Str;

/** Small helpers so every test can build its world in one line. */
trait MakesBlogData
{
    protected function makeUser(array $attrs = []): User
    {
        static $n = 0;
        $n++;

        return User::create(array_merge([
            'name' => "User $n", 'email' => "user$n@example.test", 'password' => 'password123',
        ], $attrs));
    }

    protected function makeAdmin(): User
    {
        return $this->makeUser(['role' => User::ROLE_ADMIN]);
    }

    protected function makeCategory(string $name = 'Разработка'): Category
    {
        return Category::firstOrCreate(['name' => $name], ['slug' => Str::slug($name)]);
    }

    protected function makePost(User $author, array $attrs = [], array $tags = []): Post
    {
        $post = Post::create(array_merge([
            'user_id' => $author->id,
            'category_id' => $this->makeCategory()->id,
            'title' => 'Тестовая публикация',
            'body' => 'Достаточно длинный текст публикации для проверки.',
            'status' => Post::STATUS_PUBLISHED,
            'published_at' => now(),
        ], $attrs));

        $post->tags()->sync(collect($tags)->map(
            fn ($t) => Tag::firstOrCreate(['slug' => Str::slug($t)], ['name' => $t])->id
        )->all());

        return $post;
    }
}
