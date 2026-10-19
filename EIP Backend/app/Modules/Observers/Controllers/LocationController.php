<?php

namespace App\Modules\Observers\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assignments\Models\ObserverAssignment;
use App\Modules\Observers\Models\GpsLocation;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function store(Request $request)
    {
        abort_unless($request->user()->role_type === 'observer', 403, 'Only observers can submit field locations.');
        abort_unless(
            ObserverAssignment::query()
                ->where('tenant_id', $request->user()->tenant_id)
                ->where('observer_id', $request->user()->id)
                ->exists(),
            403,
            'An observer assignment is required before sharing a location.'
        );

        $data = $request->validate([
            'latitude'      => ['required', 'numeric', 'between:-90,90'],
            'longitude'     => ['required', 'numeric', 'between:-180,180'],
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'captured_at'   => ['nullable', 'date'],
        ]);

        $location = GpsLocation::create([
            'user_id'       => $request->user()->id,
            'latitude'      => $data['latitude'],
            'longitude'     => $data['longitude'],
            'battery_level' => $data['battery_level'] ?? null,
            'captured_at'   => $data['captured_at'] ?? now(),
        ]);

        return response()->json([
            'message'  => 'Location recorded.',
            'location' => $location,
        ], 201);
    }
}
