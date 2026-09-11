<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class ObserverController extends Controller
{
    /**
     * Display a listing of observers
     */
    public function index(): View
    {
        $observers = [
            (object)[
                'id' => 1,
                'name' => 'John Adebayo',
                'email' => 'john.adebayo@example.com',
                'phone' => '+2348012345678',
                'state' => 'Lagos',
                'lga' => 'Lagos Island',
                'ward' => 'Ward A',
                'pollingUnit' => 'PU-001',
                'status' => 'active',
                'reportsCount' => 5,
                'incidentsCount' => 0,
            ],
            (object)[
                'id' => 2,
                'name' => 'Mary Okafor',
                'email' => 'mary.okafor@example.com',
                'phone' => '+2348087654321',
                'state' => 'Abia',
                'lga' => 'Umuahia North',
                'ward' => 'Ward B',
                'pollingUnit' => 'PU-002',
                'status' => 'active',
                'reportsCount' => 8,
                'incidentsCount' => 1,
            ],
        ];

        return view('admin.observers.index', [
            'observers' => $observers,
        ]);
    }

    /**
     * Show the form for creating a new observer
     */
    public function create(): View
    {
        return view('admin.observers.create');
    }

    /**
     * Show the form for editing an observer
     */
    public function edit($id): View
    {
        $observer = (object)[
            'id' => $id,
            'name' => 'John Adebayo',
            'email' => 'john.adebayo@example.com',
            'phone' => '+2348012345678',
            'state' => 'Lagos',
            'lga' => 'Lagos Island',
            'ward' => 'Ward A',
            'pollingUnit' => 'PU-001',
            'status' => 'active',
        ];

        return view('admin.observers.edit', ['observer' => $observer]);
    }
}
