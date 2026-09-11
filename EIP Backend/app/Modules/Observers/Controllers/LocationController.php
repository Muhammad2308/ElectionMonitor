<?php

namespace App\Modules\Observers\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function store(Request $request)
    {
        // M7 — implementation pending
        return response()->json(['message' => 'Location tracking endpoint ready. Implementation in M7.'], 501);
    }
}
