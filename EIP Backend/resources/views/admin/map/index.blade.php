@extends('layouts.admin')

@section('title', 'Map View - ElectWatch Admin')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white">Map View</h2>
            <p class="text-gray-400 mt-1">
                <span class="inline-flex items-center gap-1">
                    <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span class="text-green-400">LIVE</span>
                </span>
                — Real-time observer and polling unit tracking
            </p>
        </div>
    </div>

    <!-- Map Container -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden" style="height: 600px;">
        <div class="w-full h-full bg-gray-900 flex items-center justify-center">
            <div class="text-center">
                <div class="text-6xl mb-4">🗺</div>
                <h3 class="text-xl font-bold text-white mb-2">Map Integration</h3>
                <p class="text-gray-400 mb-4">Integrate with Google Maps, Leaflet, or Mapbox API</p>
                <p class="text-sm text-gray-500">
                    Display real-time observer locations and polling unit coverage
                </p>
            </div>
        </div>
    </div>

    <!-- Map Controls -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label class="block text-sm font-medium text-gray-300 mb-2">LGA</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="">All LGAs</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Show</label>
                <select class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none">
                    <option value="both">Observers & Units</option>
                    <option value="observers">Observers Only</option>
                    <option value="units">Polling Units Only</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Zoom</label>
                <input type="range" min="5" max="18" value="12" class="w-full">
            </div>
        </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-gray-400 text-sm font-medium mb-2">Coverage</h3>
            <div class="text-3xl font-bold text-white mb-2">94.2%</div>
            <div class="w-full bg-gray-900 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: 94.2%"></div>
            </div>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-gray-400 text-sm font-medium mb-2">Observers Deployed</h3>
            <div class="text-3xl font-bold text-white">213/274</div>
            <p class="text-gray-400 text-xs mt-2">77.7% active</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-gray-400 text-sm font-medium mb-2">Average Response Time</h3>
            <div class="text-3xl font-bold text-white">2.4s</div>
            <p class="text-gray-400 text-xs mt-2">For incident reporting</p>
        </div>
    </div>
</div>
@endsection
