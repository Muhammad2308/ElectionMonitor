<?php

namespace App\Modules\Assignments\Models;

use App\Models\User;
use App\Modules\ReferenceData\Models\Lga;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * An active LGA jurisdiction granted to a tenant state administrator.
 *
 * The tenant id is retained on the assignment so the composite foreign keys
 * in the schema prevent assigning an admin from a different tenant.
 */
class AdminLgaAssignment extends Model
{
    protected $table = 'admin_lga_assignments';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'lga_id',
        'assigned_by',
        'is_active',
        'assigned_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'assigned_at' => 'datetime',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function lga()
    {
        return $this->belongsTo(Lga::class);
    }
}
