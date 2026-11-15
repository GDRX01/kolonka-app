<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComplaintResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\Comment;
use App\Models\Complaint;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $weekAgo = now()->subWeek();
        $from = now()->subDays(13)->startOfDay();

        // 14 days of activity, with zeros for days without events
        $postsByDay = Post::where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')->groupBy('d')->pluck('c', 'd');
        $commentsByDay = Comment::where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')->groupBy('d')->pluck('c', 'd');

        $activity = [];
        for ($i = 0; $i < 14; $i++) {
            $day = $from->copy()->addDays($i);
            $key = $day->toDateString();
            $activity[] = [
                'date' => $key,
                'posts' => (int) ($postsByDay[$key] ?? 0),
                'comments' => (int) ($commentsByDay[$key] ?? 0),
            ];
        }

        return response()->json([
            'totals' => [
                'users' => User::count(),
                'posts' => Post::count(),
                'comments' => Comment::count(),
                'complaints' => Complaint::count(),
            ],
            'week' => [
                'users' => User::where('created_at', '>=', $weekAgo)->count(),
                'posts' => Post::where('created_at', '>=', $weekAgo)->count(),
                'comments' => Comment::where('created_at', '>=', $weekAgo)->count(),
                'new_complaints' => Complaint::where('status', Complaint::STATUS_NEW)->count(),
            ],
            'activity' => $activity,
            'recent_complaints' => ComplaintResource::collection(
                Complaint::with('post:id,title')->orderByDesc('created_at')->limit(4)->get()
            )->resolve(),
            'new_users' => UserResource::collection(User::orderByDesc('created_at')->limit(4)->get())->resolve(),
            'recent_posts' => PostResource::collection(
                Post::cards()->orderByDesc('posts.created_at')->limit(4)->get()
            )->resolve(),
        ]);
    }
}
