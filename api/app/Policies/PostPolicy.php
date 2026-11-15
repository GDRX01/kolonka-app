<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

/** Auto-discovered by Laravel (Post -> PostPolicy). */
class PostPolicy
{
    /** The author edits only their own posts; an admin may edit any. */
    public function update(User $user, Post $post): bool
    {
        return $user->isAdmin() || $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $this->update($user, $post);
    }
}
