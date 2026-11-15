<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function index(Request $request, RecommendationService $service): JsonResponse
    {
        $result = $service->forUser(
            $request->user('sanctum'),
            max(1, min((int) $request->query('limit', 3), 12))
        );

        return response()->json([
            'data' => PostResource::collection($result['posts'])->resolve(),
            'personalized' => $result['personalized'],
            'interests' => $result['interests'],
        ]);
    }
}
