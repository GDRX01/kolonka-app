<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $fillable = ['name', 'slug'];

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_tag');
    }

    /** "  #Laravel  " -> "laravel" */
    public static function normalize(string $name): string
    {
        $name = mb_strtolower(trim($name));
        $name = ltrim($name, '#');

        return trim(preg_replace('/\s+/u', ' ', $name));
    }
}
