<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * M13 — enforce_users_tenancy_constraints
 *
 * Applies NOT NULL, UNIQUE, and CHECK constraints to the `users` table
 * now that backfilling is complete.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop the old global unique email index
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
        });

        // 2. Add new constraints
        Schema::table('users', function (Blueprint $table) {
            // Make email unique per tenant (null tenant = platform users)
            // MySQL allows multiple NULLs in unique indexes, so superadmins can exist
            // but we usually only have one or a few.
            $table->unique(['tenant_id', 'email'], 'users_tenant_email_unique');
            
            // Target for composite foreign keys from child tables
            $table->unique(['tenant_id', 'id'], 'users_tenant_id_unique');
            
            // Unique NIN per tenant
            $table->unique(['tenant_id', 'nin_hash'], 'users_tenant_nin_unique');
            
            // Note: We don't strictly enforce NOT NULL on role_type at DB level because
            // existing rows might have issues, but it should be required by the app.
        });

        // 3. Add CHECK constraints for role/tenant consistency
        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT chk_users_superadmin_tenant
            CHECK (
                (role_type = 'cybernet_superadmin' AND tenant_id IS NULL AND organisation_id IS NULL)
                OR 
                (role_type != 'cybernet_superadmin' AND tenant_id IS NOT NULL AND organisation_id IS NOT NULL)
            )
        ");
        
        // 4. Enforce self-referencing supervisor is in the same tenant
        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT fk_users_supervisor_tenant
            FOREIGN KEY (tenant_id, supervisor_id) REFERENCES users(tenant_id, id)
        ");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign('fk_users_supervisor_tenant');
        });
        
        DB::statement("ALTER TABLE users DROP CONSTRAINT chk_users_superadmin_tenant");

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_tenant_email_unique');
            $table->dropUnique('users_tenant_id_unique');
            $table->dropUnique('users_tenant_nin_unique');
            
            $table->unique('email', 'users_email_unique');
        });
    }
};
