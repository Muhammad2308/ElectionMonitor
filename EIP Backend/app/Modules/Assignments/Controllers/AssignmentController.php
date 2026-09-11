<?php

namespace App\Modules\Assignments\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function mine(Request $request)
    {
        // M13 — implementation pending
        return response()->json(['message' => 'Assignments endpoint ready. Implementation in M13.'], 501);
    }

    public function index(Request $request)
    {
        return response()->json(['message' => 'Implementation in M13.'], 501);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Implementation in M13.'], 501);
    }

    public function bulk(Request $request)
    {
        return response()->json(['message' => 'Implementation in M13.'], 501);
    }

    public function destroy(string $id)
    {
        return response()->json(['message' => 'Implementation in M13.'], 501);
    }
}
