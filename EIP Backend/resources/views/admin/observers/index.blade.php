@extends('layouts.admin')

@section('title', 'Observers Management - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white">Observer Management</h2>
            <p class="text-gray-400 mt-1">Manage election observers and their assignments</p>
        </div>
        <a href="{{ route('admin.observers.create') }}" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
            + Add Observer
        </a>
    </div>

    <!-- Filters and Search -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input type="text" placeholder="Name, email, or phone..." class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">State</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All States</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abia">Abia</option>
                    <option value="Kano">Kano</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Observers Table -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-900 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Observer</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Location</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Assigned Unit</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Reports</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Incidents</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    @foreach($observers as $observer)
                        <tr class="hover:bg-gray-700 transition-colors">
                            <td class="px-6 py-4">
                                <div>
                                    <p class="text-white font-medium">{{ $observer->name }}</p>
                                    <p class="text-gray-400 text-sm">{{ $observer->email }}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-sm">
                                    <p class="text-white">{{ $observer->state }}, {{ $observer->lga }}</p>
                                    <p class="text-gray-400">{{ $observer->ward }}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-white font-medium">{{ $observer->pollingUnit }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-white">{{ $observer->reportsCount }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-white">{{ $observer->incidentsCount }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold {{ $observer->status === 'active' ? 'bg-green-700 text-green-100' : 'bg-gray-700 text-gray-300' }}">
                                    <span class="w-2 h-2 rounded-full {{ $observer->status === 'active' ? 'bg-green-400' : 'bg-gray-400' }}"></span>
                                    {{ ucfirst($observer->status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex gap-2">
                                    <a href="{{ route('admin.observers.edit', $observer->id) }}" class="text-blue-400 hover:text-blue-300 text-sm">Edit</a>
                                    <button class="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
        <p class="text-gray-400 text-sm">Showing 1 to {{ count($observers) }} of {{ count($observers) }} observers</p>
        <div class="flex gap-2">
            <button class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                ← Previous
            </button>
            <button class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                Next →
            </button>
        </div>
    </div>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
@endsection
