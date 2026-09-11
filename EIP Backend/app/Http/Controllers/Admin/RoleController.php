<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\View\View;

class RoleController extends Controller
{
    public function index(): View
    {
        $roles = [
            (object)[
                'id' => 1,
                'name' => 'Admin',
                'description' => 'Full system access',
                'permissions' => 47,
                'users' => 5,
                'created_at' => now()->subDays(90),
            ],
            (object)[
                'id' => 2,
                'name' => 'Observer',
                'description' => 'Can submit reports and incidents',
                'permissions' => 12,
                'users' => 274,
                'created_at' => now()->subDays(90),
            ],
            (object)[
                'id' => 3,
                'name' => 'Moderator',
                'description' => 'Can moderate reports and manage observers',
                'permissions' => 28,
                'users' => 18,
                'created_at' => now()->subDays(60),
            ],
        ];

        return view('admin.roles.index', ['roles' => $roles]);
    }

    public function create(): View
    {
        return view('admin.roles.create');
    }

    public function edit($id): View
    {
        $role = (object)[
            'id' => $id,
            'name' => 'Observer',
            'description' => 'Can submit reports and incidents',
            'permissions' => [1, 2, 3, 4, 5],
        ];

        return view('admin.roles.edit', ['role' => $role]);
    }
}
