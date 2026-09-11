<!-- Sidebar Navigation -->
<aside class="w-96 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
    <!-- Logo Section -->
    <div class="p-6 border-b border-gray-800">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                E
            </div>
            <div>
                <h1 class="text-xl font-bold">ElectWatch</h1>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Admin Console</p>
            </div>
        </div>
    </div>

    <!-- Status Box -->
    <div class="px-6 py-4">
        <div class="border border-green-500 border-opacity-30 rounded-lg p-4 bg-green-950 bg-opacity-20">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-green-400 text-sm font-semibold uppercase tracking-wide">Polls Open</span>
            </div>
            <p class="text-gray-300 text-sm">Closes in <span id="countdown">3h 42m</span></p>
        </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        <!-- Dashboard -->
        <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white' }} transition-colors">
            <span class="text-xl">⊞</span>
            <span class="font-medium">Dashboard</span>
        </a>

        <!-- User Management (Expandable) -->
        <div x-data="{ open: true }">
            <button @click="open = !open" class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left">
                <div class="flex items-center gap-3">
                    <span class="text-xl">👥</span>
                    <span class="font-medium">User Mgmt</span>
                </div>
                <span :class="open && 'rotate-90'" class="transition-transform">›</span>
            </button>

            <!-- Submenu -->
            <div x-show="open" class="ml-8 space-y-1 mt-1">
                <a href="{{ route('admin.observers.index') }}" class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                    <span>👁</span>
                    <span>Observers</span>
                </a>
                <a href="{{ route('admin.roles.index') }}" class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                    <span>🏷</span>
                    <span>Roles</span>
                </a>
                <a href="{{ route('admin.permissions.index') }}" class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                    <span>🔐</span>
                    <span>Permissions</span>
                </a>
            </div>
        </div>

        <!-- Map View -->
        <a href="{{ route('admin.map') }}" class="flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <div class="flex items-center gap-3">
                <span class="text-xl">🗺</span>
                <span class="font-medium">Map View</span>
            </div>
            <span class="bg-green-600 text-green-100 px-2 py-1 rounded text-xs font-semibold">LIVE</span>
        </a>

        <!-- Messages -->
        <a href="{{ route('admin.messages') }}" class="flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <div class="flex items-center gap-3">
                <span class="text-xl">💬</span>
                <span class="font-medium">Messages</span>
            </div>
            <span class="bg-red-600 text-red-100 px-2 py-1 rounded text-xs font-semibold">{{ $unreadMessages ?? 4 }}</span>
        </a>

        <!-- Reports (if needed) -->
        <a href="{{ route('admin.reports.index') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <span class="text-xl">📊</span>
            <span class="font-medium">Reports</span>
        </a>

        <!-- Incidents -->
        <a href="{{ route('admin.incidents.index') }}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <span class="text-xl">⚠</span>
            <span class="font-medium">Incidents</span>
        </a>
    </nav>

    <!-- User Profile Section -->
    <div class="border-t border-gray-800 p-4">
        <div class="flex items-center gap-3 px-2">
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                {{ substr(Auth::user()->name, 0, 1) }}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ Auth::user()->name ?? 'System Admin' }}</p>
                <p class="text-gray-400 text-xs truncate">{{ Auth::user()->email ?? 'admin@electwatch.ng' }}</p>
            </div>
        </div>
    </div>
</aside>

<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
