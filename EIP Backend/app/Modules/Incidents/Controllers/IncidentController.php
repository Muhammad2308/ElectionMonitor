<?php

namespace App\Modules\Incidents\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Authorization\GeographicScope;
use App\Modules\Incidents\Requests\UploadMediaRequest;
use App\Modules\Incidents\Requests\ReportIncidentRequest;
use App\Modules\Incidents\Resources\IncidentResource;
use App\Modules\Incidents\Services\IncidentReportingService;
use App\Modules\Incidents\Models\Incident;
use App\Modules\Incidents\Models\IncidentMedia;
use App\Modules\ReferenceData\Models\PollingUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IncidentController extends Controller
{
    protected $reportingService;

    public function __construct(IncidentReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    /**
     * List incidents with optional filters (paginated).
     */
    public function index(Request $request)
    {
        abort_unless($request->user()->can('incidents.view'), 403, 'Missing incidents.view permission.');

        $query = Incident::query()->with(['category', 'pollingUnit.ward.lga.state', 'user', 'media']);

        if ($request->user()->can('incidents.view-all')) {
            if ($request->user()->role_type !== 'national_master_admin') {
                app(GeographicScope::class)->applyToIncidents($query, $request->user());
            }
        } else {
            $query->where('reporter_id', $request->user()->id);
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->string('severity'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('state_id')) {
            $query->whereHas('pollingUnit.ward.lga', function ($q) use ($request) {
                $q->where('state_id', $request->integer('state_id'));
            });
        }

        if ($request->filled('search')) {
            $term = $request->string('search');
            $query->where('description', 'like', "%{$term}%");
        }

        $incidents = $query->orderByDesc('incident_time')
            ->paginate($request->integer('limit', 20));

        return IncidentResource::collection($incidents);
    }

    /**
     * Show a single incident.
     */
    public function show(Request $request, string $id)
    {
        $incident = Incident::with(['category', 'pollingUnit.ward.lga.state', 'user', 'media'])
            ->findOrFail($id);
        abort_unless($this->canViewIncident($request, $incident), 403, 'You are not allowed to view this incident.');

        return new IncidentResource($incident);
    }

    /**
     * Store a new incident report.
     */
    public function store(ReportIncidentRequest $request)
    {
        $pollingUnitQuery = PollingUnit::query();
        if ($request->user()->role_type !== 'national_master_admin') {
            app(GeographicScope::class)->applyToPollingUnits($pollingUnitQuery, $request->user());
        }
        abort_unless(
            $pollingUnitQuery->whereKey($request->validated('polling_unit_id'))->exists(),
            403,
            'This polling unit is outside your assignment.'
        );

        $incident = $this->reportingService->report($request->validated(), $request->user());

        return response()->json([
            'message' => 'Incident reported successfully.',
            'incident' => new IncidentResource($incident),
        ], 201);
    }

    /**
     * Upload media for an existing incident.
     */
    public function uploadMedia(UploadMediaRequest $request)
    {
        $incident = Incident::findOrFail($request->validated('incident_id'));
        abort_unless(
            $incident->reporter_id === $request->user()->id
                || $this->canViewIncident($request, $incident),
            403,
            'You are not allowed to attach media to this incident.'
        );

        $media = $this->reportingService->storeMedia(
            $incident,
            $request->file('file'),
            $request->validated('type')
        );

        return response()->json([
            'message' => 'Media uploaded successfully.',
            'media' => $media
        ], 201);
    }

    public function showMedia(Request $request, string $id, string $mediaId)
    {
        $incident = Incident::findOrFail($id);
        abort_unless($this->canViewIncident($request, $incident), 403, 'You are not allowed to view this incident evidence.');

        $media = IncidentMedia::query()
            ->where('incident_id', $incident->id)
            ->where('tenant_id', $incident->tenant_id)
            ->whereKey($mediaId)
            ->firstOrFail();

        if (Storage::disk('private')->exists($media->storage_path)) {
            return Storage::disk('private')->response($media->storage_path, null, [
                'Content-Type' => $media->mime_type,
                'Content-Disposition' => 'inline',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        // Existing evidence uploaded before private media delivery remains
        // available through this authorized endpoint.
        abort_unless(Storage::disk('public')->exists($media->storage_path), 404);
        return Storage::disk('public')->response($media->storage_path, null, [
            'Content-Type' => $media->mime_type,
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function canViewIncident(Request $request, Incident $incident): bool
    {
        $user = $request->user();
        if ($incident->reporter_id === $user->id) {
            return true;
        }
        if (! $user->can('incidents.view-all')) {
            return false;
        }
        if ($user->role_type === 'national_master_admin') {
            return true;
        }

        return app(GeographicScope::class)
            ->applyToIncidents(Incident::query(), $user)
            ->whereKey($incident->id)
            ->exists();
    }
}
