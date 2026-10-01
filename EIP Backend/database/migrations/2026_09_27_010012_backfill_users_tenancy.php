<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * M12 — backfill_users_tenancy
 *
 * Data migration script.
 * 1. Creates a 'Legacy Demo' organisation and a 'Legacy State' tenant.
 * 2. Moves all existing users (except cybernet_superadmin equivalents) into this tenant.
 * 3. Assigns role_type and user_code so constraints can be applied in M13.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Check if there are existing users to backfill
        $userCount = DB::table('users')->count();
        if ($userCount === 0) {
            return;
        }

        // 2. Create Legacy Organisation
        $orgId = DB::table('organisations')->insertGetId([
            'uuid' => Str::uuid(),
            'name' => 'Legacy Demo Organisation',
            'short_code' => 'LEG',
            'type' => 'neutral',
            'neutral_category' => 'other',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Create Legacy Tenant (assuming state scope, using first state or null workaround)
        $stateId = DB::table('states')->first()?->id;

        $tenantId = DB::table('tenants')->insertGetId([
            'uuid' => Str::uuid(),
            'organisation_id' => $orgId,
            'scope' => 'state',
            'state_id' => $stateId,
            'name' => 'Legacy Demo Tenant',
            'slug' => 'legacy-demo-tenant',
            'code' => 'LEG-ST',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Update users (simplistic mapping, assuming first user is superadmin)
        $users = DB::table('users')->orderBy('id')->get();
        $isFirst = true;

        foreach ($users as $user) {
            if ($isFirst) {
                // Cybernet Superadmin
                DB::table('users')->where('id', $user->id)->update([
                    'role_type' => 'cybernet_superadmin',
                    // organisation_id and tenant_id remain NULL
                ]);
                $isFirst = false;
            } else {
                // Map everyone else to observer for now, or use existing role logic if Spatie tables exist
                // Assuming observer as safe default for backfill
                DB::table('users')->where('id', $user->id)->update([
                    'organisation_id' => $orgId,
                    'tenant_id' => $tenantId,
                    'role_type' => 'observer',
                    'user_code' => 'LEG-ST-OB-' . str_pad($user->id, 5, '0', STR_PAD_LEFT),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Data migration down is usually empty or just clears the added fields
        DB::table('users')->update([
            'organisation_id' => null,
            'tenant_id' => null,
            'user_code' => null,
            'role_type' => null,
        ]);
        
        DB::table('tenants')->where('slug', 'legacy-demo-tenant')->delete();
        DB::table('organisations')->where('short_code', 'LEG')->delete();
    }
};
