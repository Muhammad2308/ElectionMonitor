@extends('layouts.admin')

@section('title', 'Roles Management - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white">Role Management</h2>
            <p class="text-gray-400 mt-1">Manage user roles and permissions</p>
        </div>
        <a href="{{ route('admin.roles.create') }}" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
            + New Role
        </a>
    </div>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @foreach($roles as $role)
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-white">{{ $role->name }}</h3>
                        <p class="text-gray-400 text-sm mt-1">{{ $role->description }}</p>
                    </div>
                </div>

                <div class="space-y-3 mb-6">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400 text-sm">Permissions</span>
                        <span class="text-white font-semibold">{{ $role->permissions }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400 text-sm">Users assigned</span>
                        <span class="text-white font-semibold">{{ $role->users }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400 text-sm">Created</span>
                        <span class="text-gray-400 text-sm">{{ $role->created_at->diffForHumans() }}</span>
                    </div>
                </div>

                <div class="flex gap-2 pt-4 border-t border-gray-700">
                    <a href="{{ route('admin.roles.edit', $role->id) }}" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium text-center transition-colors">
                        Edit
                    </a>
                    <button class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg font-medium transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        @endforeach
    </div>
</div>
@endsection
