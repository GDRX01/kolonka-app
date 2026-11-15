<?php

namespace App\Http\Resources;

use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComplaintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reason' => $this->reason,
            'reason_label' => Complaint::REASONS[$this->reason] ?? $this->reason,
            'details' => $this->details,
            'status' => $this->status,
            'resolution' => $this->resolution,
            'created_at' => $this->created_at,
            'resolved_at' => $this->resolved_at,
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'email' => $this->sender->email,
            ]),
            'admin' => $this->whenLoaded('admin', fn () => $this->admin ? [
                'id' => $this->admin->id,
                'name' => $this->admin->name,
            ] : null),
            'post' => $this->whenLoaded('post', fn () => [
                'id' => $this->post->id,
                'title' => $this->post->title,
                'status' => $this->post->status,
                'published_at' => $this->post->published_at,
                'author' => $this->post->relationLoaded('author') && $this->post->author
                    ? ['id' => $this->post->author->id, 'name' => $this->post->author->name]
                    : null,
                'complaints_count' => $this->post->complaints_count ?? null,
            ]),
        ];
    }
}
