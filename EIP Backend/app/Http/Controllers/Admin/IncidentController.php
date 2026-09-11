<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class IncidentController extends Controller
{
    public function index(): View
    {
        $incidents = [
            (object)[
                'id' => 1,
                'title' => 'Ballot irregularity reported',
                'description' => 'Discrepancy noted in ballot count at PU-001',
                'severity' => 'critical',
                'state' => 'Lagos',
                'pollingUnit' => 'PU-001',
                'observer' => 'John Adebayo',
                'status' => 'open',
                'created_at' => now()->subMinutes(5),
            ],
            (object)[
                'id' => 2,
                'title' => 'Observer not arrived',
                'description' => 'Assigned observer failed to report to polling unit',
                'severity' => 'high',
                'state' => 'Abia',
                'pollingUnit' => 'PU-045',
                'observer' => 'Mary Okafor',
                'status' => 'open',
                'created_at' => now()->subMinutes(30),
            ],
        ];

        return view('admin.incidents.index', ['incidents' => $incidents]);
    }

    public function show($id): View
    {
        $incident = (object)[
            'id' => $id,
            'title' => 'Ballot irregularity reported',
            'description' => 'Detailed description of the incident...',
            'severity' => 'critical',
            'status' => 'open',
        ];

        return view('admin.incidents.show', ['incident' => $incident]);
    }
}
