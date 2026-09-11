<?php

namespace App\Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['message' => 'Implementation in M19.'], 501);
    }

    public function markRead(Request $request, string $id)
    {
        return response()->json(['message' => 'Implementation in M19.'], 501);
    }
}
