<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Cover photo of a post: chosen by the author (or an admin) in the editor.
 *
 * Files live on the "public" disk -> storage/app/public/covers/<random name>.jpg|png
 * and are sent to the browser by GET /api/covers/<name> (see show()), so neither the
 * `php artisan storage:link` symlink nor any web-server alias is needed.
 */
class PostCoverController extends Controller
{
    /** GET /api/covers/{file} - public; the random 40-character name cannot be guessed. */
    public function show(string $file)
    {
        // the route already allows only letters and digits + a short extension (no "../")
        abort_unless(in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png'], true), 404);

        $path = 'covers/'.$file;
        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);

        // The name changes with every upload, so browsers may cache the file "forever".
        return $disk->response($path, $file, [
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** POST /api/posts/{post}/cover  (multipart/form-data, field "cover") */
    public function store(Request $request, Post $post): JsonResponse
    {
        Gate::authorize('update', $post);   // author or admin

        // A clear message instead of a mysterious "Server Error" if the migration was forgotten
        if (! Schema::hasColumn('posts', 'cover_path')) {
            return response()->json([
                'message' => 'В таблице posts нет колонки cover_path. Выполните в папке backend команду: php artisan migrate',
            ], 500);
        }

        $request->validate([
            'cover' => [
                'required',
                'file',
                'image',                                   // really is a picture (checked by content, not by name)
                'mimes:jpg,jpeg,png',                      // only JPG and PNG (no SVG, GIF, WebP)
                'max:5120',                                // 5 MB, the value is in kilobytes
                'dimensions:max_width=8000,max_height=8000',   // protects the server from "image bombs"
            ],
        ]);

        // A random file name is generated, so the user's original name can never be abused (../, .php ...)
        $newPath = $request->file('cover')->store('covers', 'public');
        $oldPath = $post->cover_path;

        $post->update(['cover_path' => $newPath]);

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);   // replace = delete the previous file
        }

        return response()->json(['cover_url' => $post->coverUrl()]);
    }

    /** DELETE /api/posts/{post}/cover - go back to the gradient. */
    public function destroy(Post $post): JsonResponse
    {
        Gate::authorize('update', $post);

        if ($post->cover_path) {
            Storage::disk('public')->delete($post->cover_path);
            $post->update(['cover_path' => null]);
        }

        return response()->json(['cover_url' => null]);
    }
}
