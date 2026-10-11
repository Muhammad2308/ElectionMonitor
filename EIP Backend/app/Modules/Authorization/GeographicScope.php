<?php

namespace App\Modules\Authorization;

use App\Models\User;
use App\Modules\Assignments\Models\AdminLgaAssignment;
use App\Modules\ReferenceData\Models\PollingUnit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Applies a user's effective geographic jurisdiction to reference data.
 *
 * State master admins inherit every LGA in their state. State admins inherit
 * only active LGA assignments; wards and polling units are descendants of
 * those LGAs. Observers inherit only polling units assigned to them.
 */
class GeographicScope
{
    /** Return active LGA ids, or null when the user has the whole state. */
    public function assignedLgaIds(User $user): ?Collection
    {
        if ($user->role_type === 'state_master_admin') {
            return null;
        }

        if ($user->role_type !== 'state_admin') {
            throw new AccessDeniedHttpException('This user role has no LGA administration scope.');
        }

        return AdminLgaAssignment::query()
            ->active()
            ->where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->pluck('lga_id');
    }

    public function applyToLgas(Builder $query, User $user): Builder
    {
        $this->requireState($user);
        $query->where('state_id', $user->state_id);

        if ($user->role_type === 'state_admin') {
            $query->whereIn('id', $this->assignedLgaIds($user) ?? collect());
        } elseif ($user->role_type !== 'state_master_admin') {
            throw new AccessDeniedHttpException('This user role cannot browse administrative LGAs.');
        }

        return $query;
    }

    public function applyToWards(Builder $query, User $user): Builder
    {
        return $query->whereHas('lga', fn (Builder $lgas) => $this->applyToLgas($lgas, $user));
    }

    public function applyToPollingUnits(Builder $query, User $user): Builder
    {
        if ($user->role_type === 'observer') {
            return $query->whereHas('assignments', function (Builder $assignments) use ($user) {
                $assignments->where('observer_id', $user->id)
                    ->where('tenant_id', $user->tenant_id)
                    ->where('status', 'active');
            });
        }

        return $query->whereHas('ward', fn (Builder $wards) => $this->applyToWards($wards, $user));
    }

    public function applyToIncidents(Builder $query, User $user): Builder
    {
        $query->whereHas('pollingUnit', fn (Builder $units) => $this->applyToPollingUnits($units, $user));

        if ($user->role_type === 'observer') {
            $query->where('reporter_id', $user->id);
        }

        return $query;
    }

    private function requireState(User $user): void
    {
        if ($user->state_id === null || $user->tenant_id === null) {
            throw new AccessDeniedHttpException('A state tenant and state assignment are required.');
        }
    }
}
