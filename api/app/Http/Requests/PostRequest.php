<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Used for both creating and updating an article. */
class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;   // ownership is checked by PostPolicy in the controller
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:3', 'max:120'],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'body' => ['required', 'string', 'min:10', 'max:100000'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'tags' => ['nullable', 'array', 'max:5'],
            'tags.*' => ['string', 'max:30'],
            'status' => ['required', 'in:draft,published'],
        ];
    }
}
