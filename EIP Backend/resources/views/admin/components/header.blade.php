<!-- Header with Status and Date/Time -->
<header class="border-b border-gray-800 bg-gray-900 px-8 py-6">
    <div class="flex items-start justify-between">
        <div>
            <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-green-400 text-sm font-semibold uppercase tracking-wide">Live Monitoring Active</span>
            </div>
            <h1 class="text-5xl font-bold text-white mb-2">Election Command Center</h1>
            <p class="text-gray-400 text-lg">Federal Election 2025 — Observation & Reporting Overview</p>
        </div>

        <div class="text-right space-y-2">
            <div class="text-gray-400 text-sm" id="currentDate"></div>
            <div class="text-3xl font-bold text-white font-mono" id="currentTime"></div>
            <div class="flex justify-end gap-2 mt-4">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-green-400 text-xs font-semibold uppercase tracking-wide">Polling in Progress</span>
            </div>
        </div>
    </div>
</header>

<script>
document.addEventListener('DOMContentLoaded', function() {
    function updateDateTime() {
        const now = new Date();
        
        // Format date
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        const dateStr = now.toLocaleDateString('en-US', dateOptions);
        document.getElementById('currentDate').textContent = dateStr;
        
        // Format time
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('currentTime').textContent = `${hours}:${minutes}:${seconds} WAT`;
    }
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
});
</script>
