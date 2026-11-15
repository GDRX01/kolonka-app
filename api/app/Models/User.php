<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    public const ROLE_USER = 'user';
    public const ROLE_ADMIN = 'admin';

    protected $fillable = ['name', 'email', 'password', 'role', 'is_blocked'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',   // plain text is hashed automatically on save
            'is_blocked' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /** Complaints this user has sent. */
    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    /** Complaints this user (as admin) has handled. */
    public function handledComplaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'admin_id');
    }
}
