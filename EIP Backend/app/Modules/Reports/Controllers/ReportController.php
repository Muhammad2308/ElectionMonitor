<?php

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function incidents(Request $request)
    {
        return response()->json(['message' => 'Implementation in M17.'], 501);
    }

    public function observers(Request $request)
    {
        return response()->json(['message' => 'Implementation in M17.'], 501);
    }

    public function summary(Request $request)
    {
        return response()->json(['message' => 'Implementation in M17.'], 501);
    }
}
