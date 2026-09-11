<?php

namespace App\Modules\Observers\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    public function store(Request $request)
    {
        // M6 — implementation pending
        return response()->json(['message' => 'Check-in endpoint ready. Implementation in M6.'], 501);
    }
}
