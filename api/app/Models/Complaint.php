<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends Model
{
    public const REASONS = [
        'spam' => 'Спам или реклама',
        'abuse' => 'Оскорбления',
        'misinformation' => 'Недостоверная информация',
        'copyright' => 'Нарушение авторских прав',
        'other' => 'Другое',
    ];

    public const STATUS_NEW = 'new';
    public const STATUS_IN_REVIEW = 'in_review';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    public const STATUSES = [
        self::STATUS_NEW, self::STATUS_IN_REVIEW, self::STATUS_RESOLVED, self::STATUS_REJECTED,
    ];

    protected $fillable = [
        'user_id', 'post_id', 'reason', 'details', 'status', 'admin_id', 'resolution', 'resolved_at',
    ];

    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
