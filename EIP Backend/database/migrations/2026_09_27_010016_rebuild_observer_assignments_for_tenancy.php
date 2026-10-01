<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * M16 — rebuild_observer_assignments_for_tenancy
 *
 * Updates existing observer_assignments to include tenant_id and composite FKs.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Add new columns
        Schema::table('observer_assignments', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->cascadeOnDelete();
            
            // Rename user_id to observer_id for clarity
            $table->renameColumn('user_id', 'observer_id');
            
            $table->foreignId('election_schedule_id')->nullable()->after('polling_unit_id')->constrained('election_schedules')->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->after('election_schedule_id');
            
            $table->enum('status', ['active', 'recalled', 'completed'])->default('active')->after('assigned_by');
            $table->dateTime('assigned_at')->useCurrent()->after('status');
        });
        
        // 2. Backfill tenant_id from the user's tenant_id
        DB::statement("
            UPDATE observer_assignments oa
            JOIN users u ON oa.observer_id = u.id
            SET oa.tenant_id = u.tenant_id,
                oa.assigned_by = u.supervisor_id
            WHERE u.tenant_id IS NOT NULL
        ");
        
        // 3. Enforce constraints
        Schema::table('observer_assignments', function (Blueprint $table) {
            // Drop old simple foreign key (using explicit name from before column was renamed)
            $table->dropForeign('observer_assignments_user_id_foreign');
            
            $table->unique(['tenant_id', 'observer_id', 'polling_unit_id', 'election_schedule_id'], 'uq_obs_assign_tenant');
        });
        
        DB::statement("
            ALTER TABLE observer_assignments
            ADD CONSTRAINT fk_obs_assign_observer
            FOREIGN KEY (tenant_id, observer_id) REFERENCES users(tenant_id, id)
            ON DELETE CASCADE
        ");
        
        DB::statement("
            ALTER TABLE observer_assignments
            ADD CONSTRAINT fk_obs_assign_assigned_by
            FOREIGN KEY (tenant_id, assigned_by) REFERENCES users(tenant_id, id)
            ON DELETE SET NULL
        ");
    }

    public function down(): void
    {
        Schema::table('observer_assignments', function (Blueprint $table) {
            $table->dropForeign('fk_obs_assign_assigned_by');
            $table->dropForeign('fk_obs_assign_observer');
            $table->dropUnique('uq_obs_assign_tenant');
            
            $table->dropColumn(['status', 'assigned_at', 'assigned_by', 'election_schedule_id']);
            $table->renameColumn('observer_id', 'user_id');
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
            
            // Re-add old foreign key
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
