@extends('layouts.admin')

@section('title', 'Dashboard - ElectWatch Admin Console')

@section('content')
<div class="space-y-8">
    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Reports -->
        <x-metric-card
            icon="📋"
            :value="$metrics['totalReports'] ?? 312"
            label="Total Reports"
            subtitle="+23 this hour"
            variant="default"
            :trend="['value' => 23, 'direction' => 'up']"
        />

        <!-- Active Observers -->
        <x-metric-card
            icon="👁"
            :value="$metrics['activeObservers'] ?? 213"
            label="Active Observers"
            subtitle="of 274 deployed"
            variant="success"
        />

        <!-- Open Incidents -->
        <x-metric-card
            icon="⚠"
            :value="$metrics['openIncidents'] ?? 41"
            label="Open Incidents"
            subtitle="8 critical"
            variant="warning"
        />

        <!-- Polling Units -->
        <x-metric-card
            icon="🏛"
            :value="$metrics['pollingUnits'] ?? 847"
            label="Polling Units"
            subtitle="94.2% covered"
            variant="info"
        />
    </div>

    <!-- Activity Chart Section -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="mb-6">
            <h3 class="text-xl font-bold text-white mb-2">Incident & Report Activity</h3>
            <p class="text-gray-400 text-sm">Today, hourly breakdown</p>
        </div>

        <!-- Tabs -->
        <div x-data="{ activeTab: 'incidents' }" class="space-y-6">
            <div class="flex gap-8 border-b border-gray-700">
                <button
                    @click="activeTab = 'incidents'"
                    :class="activeTab === 'incidents' ? 'pb-4 font-medium text-white border-b-2 border-blue-600' : 'pb-4 text-gray-400 hover:text-white transition-colors'"
                >
                    Incidents
                </button>
                <button
                    @click="activeTab = 'reports'"
                    :class="activeTab === 'reports' ? 'pb-4 font-medium text-white border-b-2 border-blue-600' : 'pb-4 text-gray-400 hover:text-white transition-colors'"
                >
                    Reports
                </button>
            </div>

            <!-- Chart Placeholder -->
            <div class="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
                <div class="text-gray-500 text-center">
                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>Activity chart data visualization</p>
                    <p class="text-xs text-gray-600 mt-1">(Integration with Recharts or Chart.js)</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Incidents -->
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">Recent Incidents</h3>
            <div class="space-y-3">
                @forelse($incidents ?? [] as $incident)
                    <div class="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                        <div class="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-white text-sm font-medium truncate">{{ $incident->title }}</p>
                            <p class="text-gray-500 text-xs mt-1">{{ $incident->created_at->diffForHumans() }}</p>
                        </div>
                    </div>
                @empty
                    @for($i = 1; $i <= 3; $i++)
                        <div class="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                            <div class="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                            <div class="flex-1 min-w-0">
                                <p class="text-white text-sm font-medium truncate">Incident {{ $i }}: Ballot irregularity reported</p>
                                <p class="text-gray-500 text-xs mt-1">{{ $i * 5 }} minutes ago</p>
                            </div>
                        </div>
                    @endfor
                @endforelse
            </div>
            @if(isset($incidents) && $incidents->count() > 0)
                <div class="mt-4">
                    <a href="{{ route('admin.incidents.index') }}" class="text-blue-400 hover:text-blue-300 text-sm">
                        View all incidents →
                    </a>
                </div>
            @endif
        </div>

        <!-- Recent Reports -->
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">Latest Reports</h3>
            <div class="space-y-3">
                @forelse($reports ?? [] as $report)
                    <div class="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                        <div class="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-white text-sm font-medium truncate">{{ $report->title }}</p>
                            <p class="text-gray-500 text-xs mt-1">{{ $report->created_at->diffForHumans() }}</p>
                        </div>
                    </div>
                @empty
                    @for($i = 1; $i <= 3; $i++)
                        <div class="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                            <div class="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                            <div class="flex-1 min-w-0">
                                <p class="text-white text-sm font-medium truncate">Report {{ $i }}: Polling smooth and orderly</p>
                                <p class="text-gray-500 text-xs mt-1">{{ ($i + 5) * 2 }} minutes ago</p>
                            </div>
                        </div>
                    @endfor
                @endforelse
            </div>
            @if(isset($reports) && $reports->count() > 0)
                <div class="mt-4">
                    <a href="{{ route('admin.reports.index') }}" class="text-blue-400 hover:text-blue-300 text-sm">
                        View all reports →
                    </a>
                </div>
            @endif
        </div>
    </div>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
@endsection
