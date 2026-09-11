<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class PermissionController extends Controller
{
    public function index(): View
    {
        $permissions = [
            (object)['id' => 1, 'name' => 'view_dashboard', 'resource' => 'dashboard', 'action' => 'view'],
            (object)['id' => 2, 'name' => 'view_observers', 'resource' => 'observers', 'action' => 'view'],
            (object)['id' => 3, 'name' => 'create_observer', 'resource' => 'observers', 'action' => 'create'],
            (object)['id' => 4, 'name' => 'edit_observer', 'resource' => 'observers', 'action' => 'edit'],
            (object)['id' => 5, 'name' => 'delete_observer', 'resource' => 'observers', 'action' => 'delete'],
            (object)['id' => 6, 'name' => 'view_reports', 'resource' => 'reports', 'action' => 'view'],
            (object)['id' => 7, 'name' => 'approve_report', 'resource' => 'reports', 'action' => 'approve'],
            (object)['id' => 8, 'name' => 'view_incidents', 'resource' => 'incidents', 'action' => 'view'],
            (object)['id' => 9, 'name' => 'manage_users', 'resource' => 'users', 'action' => 'manage'],
            (object)['id' => 10, 'name' => 'manage_roles', 'resource' => 'roles', 'action' => 'manage'],
        ];

        return view('admin.permissions.index', ['permissions' => $permissions]);
    }
}
