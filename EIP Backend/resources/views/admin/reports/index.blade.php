@extends('layouts.admin')

@section('title', 'Reports Management - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white">Report Management</h2>
            <p class="text-gray-400 mt-1">Review and manage observer reports</p>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
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
                <label class="block text-sm font-medium text-gray-300 mb-2">Observer</label>
                <input type="text" placeholder="Observer name..." class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input type="text" placeholder="Report title..." class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none">
            </div>
        </div>
    </div>

    <!-- Reports Table -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-900 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Report Title</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Observer</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Location</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Submitted</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    @foreach($reports as $report)
                        <tr class="hover:bg-gray-700 transition-colors">
                            <td class="px-6 py-4">
                                <p class="text-white font-medium">{{ $report->title }}</p>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-white">{{ $report->observer }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-sm">
                                    <p class="text-white">{{ $report->state }}, {{ $report->pollingUnit }}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold {{ $report->status === 'submitted' ? 'bg-blue-700 text-blue-100' : 'bg-green-700 text-green-100' }}">
                                    {{ ucfirst($report->status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-gray-400 text-sm">{{ $report->created_at->diffForHumans() }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex gap-2">
                                    <a href="{{ route('admin.reports.show', $report->id) }}" class="text-blue-400 hover:text-blue-300 text-sm">View</a>
                                    <button class="text-green-400 hover:text-green-300 text-sm">Approve</button>
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
