<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'lga_id')) {
                $table->foreignId('lga_id')->nullable()->after('state_id')->constrained('lgas')->nullOnDelete();
            }
        });

        // Recover an observer's LGA where existing admin/PU assignments make
        // it unambiguous, so legacy observers remain visible in the right scope.
        if (Schema::hasTable('admin_lga_assignments')) {
            $singleLgaByAdmin = DB::table('admin_lga_assignments')
                ->where('is_active', true)
                ->groupBy('user_id')
                ->havingRaw('COUNT(DISTINCT lga_id) = 1')
                ->pluck(DB::raw('MIN(lga_id) as lga_id'), 'user_id');

            foreach ($singleLgaByAdmin as $adminId => $lgaId) {
                DB::table('users')->where('role_type', 'observer')->where('supervisor_id', $adminId)
                    ->whereNull('lga_id')->update(['lga_id' => $lgaId]);
            }
        }

        if (Schema::hasTable('observer_assignments')) {
            $singleLgaByObserver = DB::table('observer_assignments as assignments')
                ->join('polling_units', 'polling_units.id', '=', 'assignments.polling_unit_id')
                ->join('wards', 'wards.id', '=', 'polling_units.ward_id')
                ->groupBy('assignments.observer_id')
                ->havingRaw('COUNT(DISTINCT wards.lga_id) = 1')
                ->pluck(DB::raw('MIN(wards.lga_id) as lga_id'), 'assignments.observer_id');

            foreach ($singleLgaByObserver as $observerId => $lgaId) {
                DB::table('users')->where('id', $observerId)->whereNull('lga_id')->update(['lga_id' => $lgaId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'lga_id')) {
                $table->dropConstrainedForeignId('lga_id');
            }
        });
    }
};
