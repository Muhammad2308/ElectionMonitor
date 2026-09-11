<?php

namespace App\Modules\Users\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }

    public function show(string $id)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }

    public function update(Request $request, string $id)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }

    public function destroy(string $id)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }

    public function suspend(string $id)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }

    public function assignRole(Request $request, string $id)
    {
        return response()->json(['message' => 'Implementation in M11.'], 501);
    }
}
