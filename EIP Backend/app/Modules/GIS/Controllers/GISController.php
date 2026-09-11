<?php

namespace App\Modules\GIS\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GISController extends Controller
{
    public function pollingUnits(Request $request)
    {
        return response()->json(['message' => 'Implementation in M15.'], 501);
    }

    public function observers(Request $request)
    {
        return response()->json(['message' => 'Implementation in M15.'], 501);
    }

    public function incidents(Request $request)
    {
        return response()->json(['message' => 'Implementation in M15.'], 501);
    }
}
