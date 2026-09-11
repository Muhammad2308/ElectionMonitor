<?php

namespace App\Modules\Incidents\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Incidents\Services\IncidentReportingService;
use App\Modules\Incidents\Models\Incident;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    protected $reportingService;

    public function __construct(IncidentReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    /**
     * Store a new incident report.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer',
            'polling_unit_id' => 'required|integer',
            'description' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $incident = $this->reportingService->report($request->all(), $request->user());

        return response()->json([
            'message' => 'Incident reported successfully.',
            'incident' => $incident
        ], 201);
    }

    /**
     * Upload media for an existing incident.
     */
    public function uploadMedia(Request $request)
    {
        $request->validate([
            'incident_id' => 'required|exists:incidents,id',
            'file' => 'required|image|max:10240', // 10MB limit
            'type' => 'nullable|string'
        ]);

        $incident = Incident::findOrFail($request->incident_id);
        
        $media = $this->reportingService->storeMedia(
            $incident, 
            $request->file('file'),
            $request->type ?? 'image'
        );

        return response()->json([
            'message' => 'Media uploaded successfully.',
            'media' => $media
        ], 201);
    }
}
