<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComplaintResource;
use App\Models\Complaint;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ComplaintController extends Controller
{
    /** ?status=new|in_review|resolved|rejected (omit for all) */
    public function index(Request $request)
    {
        $query = Complaint::with([
            'sender:id,name,email',
            'admin:id,name',
            'post' => fn ($q) => $q->withCount('complaints')->with('author:id,name'),
        ]);

        if (in_array($status = $request->query('status'), Complaint::STATUSES, true)) {
            $query->where('status', $status);
        }

        $query->orderByDesc('created_at')->orderByDesc('id');

        $counts = Complaint::select('status', DB::raw('COUNT(*) as c'))->groupBy('status')->pluck('c', 'status');

        return ComplaintResource::collection($query->paginate(10)->withQueryString())->additional([
            'counts' => [
                'all' => (int) $counts->sum(),
                'new' => (int) ($counts['new'] ?? 0),
                'in_review' => (int) ($counts['in_review'] ?? 0),
                'resolved' => (int) ($counts['resolved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
            ],
        ]);
    }

    /** PATCH /api/admin/complaints/{id}  { status, resolution?, hide_post? } */
    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Complaint::STATUSES)],
            'resolution' => ['nullable', 'string', 'max:1000'],
            'hide_post' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $complaint, $request) {
            $closed = in_array($data['status'], [Complaint::STATUS_RESOLVED, Complaint::STATUS_REJECTED], true);

            $complaint->update([
                'status' => $data['status'],
                'resolution' => $data['resolution'] ?? $complaint->resolution,
                'admin_id' => $request->user()->id,
                'resolved_at' => $closed ? now() : null,
            ]);

            if (! empty($data['hide_post'])) {
                Post::whereKey($complaint->post_id)->update(['status' => Post::STATUS_HIDDEN]);
            }
        });

        $complaint->load(['sender:id,name,email', 'admin:id,name', 'post' => fn ($q) => $q->withCount('complaints')->with('author:id,name')]);

        return response()->json(['data' => ComplaintResource::make($complaint)->resolve()]);
    }
}
