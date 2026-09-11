<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Show the admin dashboard
     */
    public function index(): View
    {
        // Get dashboard metrics
        $metrics = [
            'totalReports' => 312,
            'activeObservers' => 213,
            'openIncidents' => 41,
            'pollingUnits' => 847,
        ];

        // Get recent incidents (this should be fetched from database)
        $incidents = collect([
            (object)[
                'id' => 1,
                'title' => 'Ballot irregularity reported',
                'severity' => 'critical',
                'created_at' => now()->subMinutes(5),
            ],
            (object)[
                'id' => 2,
                'title' => 'Observer not arrived at polling unit',
                'severity' => 'high',
                'created_at' => now()->subMinutes(12),
            ],
            (object)[
                'id' => 3,
                'title' => 'Power outage reported',
                'severity' => 'high',
                'created_at' => now()->subMinutes(25),
            ],
        ]);

        // Get recent reports (this should be fetched from database)
        $reports = collect([
            (object)[
                'id' => 1,
                'title' => 'Polling smooth and orderly',
                'status' => 'submitted',
                'created_at' => now()->subMinutes(7),
            ],
            (object)[
                'id' => 2,
                'title' => 'Voter turnout high',
                'status' => 'submitted',
                'created_at' => now()->subMinutes(15),
            ],
            (object)[
                'id' => 3,
                'title' => 'All materials accounted for',
                'status' => 'reviewed',
                'created_at' => now()->subMinutes(22),
            ],
        ]);

        return view('admin.dashboard.index', [
            'metrics' => $metrics,
            'incidents' => $incidents,
            'reports' => $reports,
            'unreadMessages' => 4,
        ]);
    }
}
