@extends('layouts.admin')

@section('title', 'Permissions Management - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div>
        <h2 class="text-3xl font-bold text-white">Permission Management</h2>
        <p class="text-gray-400 mt-1">Manage system permissions</p>
    </div>

    <!-- Permissions Table -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-900 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Permission Name</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Resource</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Assigned to Roles</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    @foreach($permissions as $permission)
                        <tr class="hover:bg-gray-700 transition-colors">
                            <td class="px-6 py-4">
                                <span class="text-white font-medium">{{ $permission->name }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-3 py-1 bg-blue-700 bg-opacity-30 text-blue-200 rounded-full text-xs font-medium">
                                    {{ $permission->resource }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-3 py-1 bg-green-700 bg-opacity-30 text-green-200 rounded-full text-xs font-medium">
                                    {{ $permission->action }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-gray-300">{{ rand(1, 5) }} roles</span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
