<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class ReportController extends Controller
{
    public function index(): View
    {
        $reports = [
            (object)[
                'id' => 1,
                'title' => 'Polling smooth and orderly',
                'observer' => 'John Adebayo',
                'pollingUnit' => 'PU-001',
                'state' => 'Lagos',
                'status' => 'submitted',
                'created_at' => now()->subMinutes(7),
            ],
            (object)[
                'id' => 2,
                'title' => 'Voter turnout high',
                'observer' => 'Mary Okafor',
                'pollingUnit' => 'PU-045',
                'state' => 'Abia',
                'status' => 'reviewed',
                'created_at' => now()->subMinutes(25),
            ],
        ];

        return view('admin.reports.index', ['reports' => $reports]);
    }

    public function show($id): View
    {
        $report = (object)[
            'id' => $id,
            'title' => 'Polling smooth and orderly',
            'content' => 'Full report content here...',
            'observer' => 'John Adebayo',
            'status' => 'submitted',
        ];

        return view('admin.reports.show', ['report' => $report]);
    }
}
