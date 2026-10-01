<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * M19 — create_incident_media_table
 *
 * Replaces the old incident_media with a tenant-scoped version.
 * Assuming the old one is dropped or renamed if it exists, or we just drop it and recreate.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Drop the old one if it exists
        Schema::dropIfExists('incident_media');

        Schema::create('incident_media', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('tenant_id')
                  ->constrained('tenants')
                  ->cascadeOnDelete();
                  
            $table->uuid('incident_id'); // If incidents.id is uuid in old schema, adjust if needed.
                                         // Let's assume incidents PK is id(bigint) based on M18 design.
            // Adjusting based on v3 design: incident_id should be bigint
        });
        
        // Correct recreation:
        Schema::dropIfExists('incident_media');
        
        Schema::create('incident_media', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('tenant_id')
                  ->constrained('tenants')
                  ->cascadeOnDelete();
                  
            // Ensure this type matches incidents.id. 
            // In v3 it's UUID or BigInt depending on how it was originally created. 
            // In the live system (2026_06_14_164254) incidents.id is UUID. 
            // WAIT, looking at 2026_06_14_164254, incidents.id is UUID!
            // Let's use uuid here to match the existing schema.
            $table->uuid('incident_id');
            
            $table->string('storage_path', 500); // tenants/{tenant_uuid}/incidents/...
            $table->string('mime_type', 100);
            $table->bigInteger('size_bytes');
            $table->char('sha256', 64);
            
            $table->timestamps();
        });
        
        // Note: Composite foreign keys involving UUIDs depend on the DB engine,
        // but typically you can just do:
        // (If incidents.id is UUID, we need to ensure incidents has UNIQUE(tenant_id, id) 
        // which was added in M18. Wait, M18 added uq_incidents_tenant_id).
        
        DB::statement("
            ALTER TABLE incident_media
            ADD CONSTRAINT fk_inc_media_incident
            FOREIGN KEY (tenant_id, incident_id) REFERENCES incidents(tenant_id, id)
            ON DELETE CASCADE
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_media');
    }
};
