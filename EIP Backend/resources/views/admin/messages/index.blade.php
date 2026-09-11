@extends('layouts.admin')

@section('title', 'Messages - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white">Messages</h2>
            <p class="text-gray-400 mt-1">Admin notifications and communications</p>
        </div>
    </div>

    <!-- Messages Filter -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="flex gap-4">
            <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                All
            </button>
            <button class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors">
                Unread
            </button>
            <button class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors">
                System
            </button>
            <button class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors">
                Observers
            </button>
        </div>
    </div>

    <!-- Messages List -->
    <div class="space-y-3">
        @for($i = 1; $i <= 5; $i++)
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors cursor-pointer">
                <div class="flex items-start gap-4">
                    <!-- Status indicator -->
                    <div class="flex-shrink-0">
                        <div class="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h3 class="text-white font-semibold">
                                    @if($i === 1)
                                        Critical Incident Reported
                                    @elseif($i === 2)
                                        System Maintenance Scheduled
                                    @elseif($i === 3)
                                        New Observer Registration
                                    @elseif($i === 4)
                                        Report Submission Alert
                                    @else
                                        Polling Unit Coverage Update
                                    @endif
                                </h3>
                                <p class="text-gray-400 text-sm mt-1">
                                    @if($i === 1)
                                        Ballot irregularity reported at PU-001 in Lagos Island
                                    @elseif($i === 2)
                                        System will be down for maintenance on 31st August 2025
                                    @elseif($i === 3)
                                        John Oladele has registered as an observer
                                    @elseif($i === 4)
                                        High voter turnout reports coming in from multiple locations
                                    @else
                                        Coverage has reached 94.2% across all states
                                    @endif
                                </p>
                            </div>
                            <span class="text-gray-400 text-sm flex-shrink-0">
                                @if($i === 1)
                                    2m ago
                                @elseif($i === 2)
                                    1h ago
                                @elseif($i === 3)
                                    3h ago
                                @elseif($i === 4)
                                    5h ago
                                @else
                                    8h ago
                                @endif
                            </span>
                        </div>

                        <!-- Tags -->
                        <div class="flex gap-2 mt-4">
                            @if($i === 1)
                                <span class="px-2 py-1 bg-red-700 bg-opacity-30 text-red-200 text-xs rounded-full font-medium">Critical</span>
                            @elseif($i === 2)
                                <span class="px-2 py-1 bg-yellow-700 bg-opacity-30 text-yellow-200 text-xs rounded-full font-medium">System</span>
                            @elseif($i === 3)
                                <span class="px-2 py-1 bg-green-700 bg-opacity-30 text-green-200 text-xs rounded-full font-medium">Registration</span>
                            @else
                                <span class="px-2 py-1 bg-blue-700 bg-opacity-30 text-blue-200 text-xs rounded-full font-medium">Report</span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        @endfor
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
        <p class="text-gray-400 text-sm">Showing 1-5 of 47 messages</p>
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
@endsection
