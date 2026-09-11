<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ObserverController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\IncidentController;
use App\Http\Controllers\Admin\ReportController;

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
