<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $me = $request->user('sanctum');

        return [
            'id' => $this->id,
            'body' => $this->body,
            'parent_id' => $this->parent_id,
            'created_at' => $this->created_at,
            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ]),
            'can_delete' => $me && ($me->isAdmin() || $me->id === $this->user_id),
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
