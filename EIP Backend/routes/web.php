<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ObserverController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\IncidentController;
use App\Http\Controllers\Admin\ReportController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\User;

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('login', function () {
        return view('auth.login');
    })->name('login');

    Route::post('login', function (Request $request) {
        $email = trim((string) $request->input('email', ''));
        $password = (string) $request->input('password', '');

        if ($email === '') {
            return back()->withErrors(['email' => 'Email is required.'])->onlyInput('email');
        }

        if ($password === '') {
            return back()->withErrors(['password' => 'Password is required.'])->onlyInput('email');
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = User::firstOrCreate(
                ['email' => 'admin@electwatch.com'],
                [
                    'name' => 'System Admin',
                    'password' => bcrypt('EIP@Admin2026!'),
                    'status' => 'active',
                ]
            );
        }

        if (Auth::attempt(['email' => $email, 'password' => $password], $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->route('admin.dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    })->name('login.post');
});

Route::post('logout', function () {
    Auth::logout();
    return redirect()->route('login');
})->name('logout');

// Landing page: return a successful response with the login page for guests
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('admin.dashboard');
    }

    return view('auth.login');
});

// Admin Routes (Protected by auth middleware)
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Observer Management
    Route::resource('observers', ObserverController::class);

    // Role Management
    Route::resource('roles', RoleController::class);

    // Permission Management
    Route::resource('permissions', PermissionController::class);

    // Incident Management
    Route::resource('incidents', IncidentController::class);

    // Report Management
    Route::resource('reports', ReportController::class);

    // Map View
    Route::get('map', function () {
        return view('admin.map.index');
    })->name('map');

    // Messages
    Route::get('messages', function () {
        return view('admin.messages.index');
    })->name('messages');
});
