@extends('layouts.admin')

@section('title', 'Incidents Management - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white">Incident Management</h2>
            <p class="text-gray-400 mt-1">Track and manage reported incidents during polling</p>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Severity</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">State</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All States</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abia">Abia</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input type="text" placeholder="Incident ID or title..." class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none">
            </div>
        </div>
    </div>

    <!-- Incidents Table -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-900 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Incident</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Location</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Reported by</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Severity</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Time</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    @foreach($incidents as $incident)
                        <tr class="hover:bg-gray-700 transition-colors">
                            <td class="px-6 py-4">
                                <div>
                                    <p class="text-white font-medium">{{ $incident->title }}</p>
                                    <p class="text-gray-400 text-sm">{{ $incident->description }}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-sm">
                                    <p class="text-white">{{ $incident->state }}, {{ $incident->pollingUnit }}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-white">{{ $incident->observer }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold {{ $incident->severity === 'critical' ? 'bg-red-700 text-red-100' : 'bg-yellow-700 text-yellow-100' }}">
                                    {{ ucfirst($incident->severity) }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-700 text-blue-100">
                                    {{ ucfirst($incident->status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-gray-400 text-sm">{{ $incident->created_at->diffForHumans() }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex gap-2">
                                    <a href="{{ route('admin.incidents.show', $incident->id) }}" class="text-blue-400 hover:text-blue-300 text-sm">View</a>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
