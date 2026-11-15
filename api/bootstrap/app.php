<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsNotBlocked;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Short names used in routes/api.php
        $middleware->alias([
            'admin'  => EnsureUserIsAdmin::class,
            'active' => EnsureUserIsNotBlocked::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every /api/* request gets JSON errors (401, 403, 404, 422 ...),
        // never an HTML page or a redirect to a login form.
        $exceptions->shouldRenderJsonWhen(
            fn ($request, $e) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
