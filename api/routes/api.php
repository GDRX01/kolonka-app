<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCoverController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\TaxonomyController;
use Illuminate\Support\Facades\Route;

/*
| REST API. Laravel adds the /api prefix automatically.
| Public routes may still receive a Bearer token: controllers then call
| $request->user('sanctum') to learn who is asking (for the "liked" flag
| and personalised recommendations) but never require it.
*/

// ---------- Public (guest) ----------
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/home', [HomeController::class, 'index']);
Route::get('/categories', [TaxonomyController::class, 'categories']);
Route::get('/tags', [TaxonomyController::class, 'tags']);

Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{id}', [PostController::class, 'show'])->whereNumber('id');
Route::get('/posts/{post}/comments', [CommentController::class, 'index'])->whereNumber('post');
Route::get('/recommendations', [RecommendationController::class, 'index']);
// Cover photo files (random names). Served through PHP, so no `storage:link` symlink is required.
Route::get('/covers/{file}', [PostCoverController::class, 'show'])->where('file', '[A-Za-z0-9]+\.[A-Za-z]{3,4}');

// ---------- Authenticated user ----------
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'update']);

    Route::get('/my/posts', [PostController::class, 'mine']);
    Route::get('/my/posts/{post}', [PostController::class, 'edit'])->whereNumber('post');
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update'])->whereNumber('post');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->whereNumber('post');

    // Cover photo: multipart upload (field "cover") and removal
    Route::post('/posts/{post}/cover', [PostCoverController::class, 'store'])
        ->whereNumber('post')->middleware('throttle:30,1');
    Route::delete('/posts/{post}/cover', [PostCoverController::class, 'destroy'])->whereNumber('post');

    Route::post('/posts/{post}/like', [LikeController::class, 'toggle'])->whereNumber('post');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])
        ->whereNumber('post')->middleware('throttle:30,1');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->whereNumber('comment');
    Route::post('/posts/{post}/complaints', [ComplaintController::class, 'store'])
        ->whereNumber('post')->middleware('throttle:10,1');

    // ---------- Administrator ----------
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/stats', [Admin\DashboardController::class, 'index']);

        Route::get('/posts', [Admin\PostController::class, 'index']);
        Route::patch('/posts/{post}', [Admin\PostController::class, 'update']);
        Route::delete('/posts/{post}', [Admin\PostController::class, 'destroy']);

        Route::get('/users', [Admin\UserController::class, 'index']);
        Route::patch('/users/{user}', [Admin\UserController::class, 'update']);

        Route::get('/categories', [Admin\CategoryController::class, 'index']);
        Route::post('/categories', [Admin\CategoryController::class, 'store']);
        Route::put('/categories/{category}', [Admin\CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [Admin\CategoryController::class, 'destroy']);

        Route::get('/tags', [Admin\TagController::class, 'index']);
        Route::post('/tags', [Admin\TagController::class, 'store']);
        Route::put('/tags/{tag}', [Admin\TagController::class, 'update']);
        Route::delete('/tags/{tag}', [Admin\TagController::class, 'destroy']);

        Route::get('/complaints', [Admin\ComplaintController::class, 'index']);
        Route::patch('/complaints/{complaint}', [Admin\ComplaintController::class, 'update']);
    });
});
