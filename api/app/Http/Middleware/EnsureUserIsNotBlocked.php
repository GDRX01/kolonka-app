<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsNotBlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->is_blocked) {
            abort(403, 'Ваша учётная запись заблокирована.');
        }

        return $next($request);
    }
}
