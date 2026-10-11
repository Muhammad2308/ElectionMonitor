<?php

namespace App\Modules\Users\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Authentication\Resources\UserResource;
use App\Modules\Audit\Models\ActivityLog;
use App\Modules\Authorization\GeographicScope;
use App\Modules\Assignments\Models\AdminLgaAssignment;
use App\Modules\Inbox\Services\InboxService;
use App\Modules\ReferenceData\Models\Lga;
use App\Services\UserCodeGenerator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    private const TENANT_ROLES = ['observer', 'state_admin', 'state_master_admin', 'national_master_admin', 'cybernet_superadmin'];

    private function isSuperAdmin(?User $user): bool
    {
        if (!$user) return false;
        return $user->role_type === 'cybernet_superadmin' || $user->hasRole('cybernet_superadmin');
    }

    private function scopeManagedUsers(Builder $query, User $admin): Builder
    {
        $isSuper = $this->isSuperAdmin($admin);
        $adminRole = $admin->role_type ?? $admin->getRoleNames()->first();

        if (!$isSuper && $admin->tenant_id !== null) {
            $query->where('tenant_id', $admin->tenant_id);
        }

        if (in_array($adminRole, ['state_admin', 'state_master_admin'], true)) {
            abort_if($admin->state_id === null || $admin->tenant_id === null, 403, 'Your account must be assigned to a state tenant.');
            $query->where('state_id', $admin->state_id);
        }

        if ($adminRole === 'state_admin') {
            $lgaIds = app(GeographicScope::class)->assignedLgaIds($admin) ?? collect();
            $query->where('role_type', 'observer')->where(function ($observers) use ($admin, $lgaIds) {
                $observers->where('supervisor_id', $admin->id);
                if ($lgaIds->isNotEmpty()) {
                    $observers->orWhereIn('lga_id', $lgaIds)
                        ->orWhereHas('assignments.pollingUnit.ward', fn ($wards) => $wards->whereIn('lga_id', $lgaIds));
                }
            });
        }

        return $query;
    }

    public function index(Request $request)
    {
        $admin = $request->user();
        abort_unless($this->isSuperAdmin($admin) || $admin->can('users.view'), 403);

        $adminRole = $admin->role_type ?? $admin->getRoleNames()->first();
        // Enforce tenant, state, and sub-admin LGA scope server-side.
        $query = $this->scopeManagedUsers(User::with(['state', 'lga']), $admin);

        if ($adminRole === 'state_admin') {
            $lgaIds = app(GeographicScope::class)->assignedLgaIds($admin) ?? collect();
            $query->withCount([
                'incidents as incidents_count' => fn ($incidents) => $incidents->whereHas('pollingUnit.ward', fn ($wards) => $wards->whereIn('lga_id', $lgaIds)),
                'assignments as assignments_count' => fn ($assignments) => $assignments
                    ->whereHas('pollingUnit.ward', fn ($wards) => $wards->whereIn('lga_id', $lgaIds))
                    ->whereDate('election_date', '>=', now()->toDateString()),
                'checkIns as check_ins_count' => fn ($checkIns) => $checkIns->whereHas('pollingUnit.ward', fn ($wards) => $wards->whereIn('lga_id', $lgaIds)),
            ]);
        } else {
            $query->withCount(['incidents', 'assignments', 'checkIns']);
        }

        if ($request->filled('role')) {
            $roleFilter = $request->string('role');
            $query->where(function ($q) use ($roleFilter) {
                $q->where('role_type', $roleFilter)
                  ->orWhereHas('roles', fn ($r) => $r->where('name', $roleFilter));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('state_id') && !in_array($adminRole, ['state_admin', 'state_master_admin'], true)) {
            $query->where('state_id', $request->integer('state_id'));
        }

        if ($request->filled('search')) {
            $term = $request->string('search');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%");
            });
        }

        $users = $query->orderByDesc('created_at')->paginate($request->integer('limit', 20));

        return UserResource::collection($users);
    }

    public function store(Request $request)
    {
        $admin = $request->user();
        $isSuper = $this->isSuperAdmin($admin);
        abort_unless($isSuper || $admin->can('users.create'), 403);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'phone'    => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'lga_id'   => ['nullable', 'integer', 'exists:lgas,id', Rule::requiredIf(in_array($request->input('role'), ['observer', 'state_admin'], true))],
            'role'     => ['required', 'string', Rule::in(self::TENANT_ROLES)],
        ]);

        $adminRole = $admin->role_type ?? $admin->getRoleNames()->first();
        if (!$isSuper) {
            $allowedRoles = $adminRole === 'state_admin' ? ['observer'] : ['observer', 'state_admin', 'state_master_admin'];
            abort_unless(in_array($data['role'], $allowedRoles, true), 403, 'Your role cannot create this account type.');
        }

        if (in_array($adminRole, ['state_admin', 'state_master_admin'], true)) {
            abort_if($admin->state_id === null || $admin->tenant_id === null, 403, 'Your account must be assigned to a state tenant.');
            if (isset($data['state_id']) && (int) $data['state_id'] !== (int) $admin->state_id) {
                throw ValidationException::withMessages(['state_id' => ['You can only create users in your state.']]);
            }
            $data['state_id'] = $admin->state_id;
        }

        // Determine tenant & state
        $stateId = $data['state_id'] ?? null;
        $tenant = null;

        if ($admin->tenant_id !== null) {
            $tenant = DB::table('tenants as t')
                ->join('organisations as o', 'o.id', '=', 't.organisation_id')
                ->where('t.id', $admin->tenant_id)
                ->first(['t.id', 't.state_id', 't.organisation_id', 'o.short_code']);
            if (in_array($adminRole, ['state_admin', 'state_master_admin'], true)) {
                abort_if(!$tenant, 403, 'Your state tenant could not be found.');
            }
            if (in_array($adminRole, ['state_admin', 'state_master_admin'], true)
                && $tenant && (int) $tenant->state_id !== (int) $admin->state_id) {
                abort(403, 'Your tenant is not configured for your assigned state.');
            }
            $stateId = $tenant->state_id ?? $stateId;
        } else {
            // Platform admin creating user
            $tenantQuery = DB::table('tenants as t')
                ->join('organisations as o', 'o.id', '=', 't.organisation_id');
            if ($stateId) {
                $tenant = (clone $tenantQuery)->where('t.state_id', $stateId)->first(['t.id', 't.state_id', 't.organisation_id', 'o.short_code']);
            }
            if (!$tenant) {
                $tenant = $tenantQuery->first(['t.id', 't.state_id', 't.organisation_id', 'o.short_code']);
            }
        }

        if ($stateId === null) {
            $stateId = $tenant?->state_id ?? DB::table('states')->value('id');
        }

        if (!empty($data['lga_id'])) {
            $lga = Lga::query()->findOrFail($data['lga_id']);
            if ((int) $lga->state_id !== (int) $stateId) {
                throw ValidationException::withMessages(['lga_id' => ['The selected LGA must belong to the selected state.']]);
            }
            if ($adminRole === 'state_admin') {
                $canUseLga = app(GeographicScope::class)->applyToLgas(Lga::query(), $admin)->whereKey($lga->id)->exists();
                abort_unless($canUseLga, 403, 'You can only create an observer in an LGA assigned to you.');
            }
            if ($data['role'] === 'state_admin') {
                abort_unless($adminRole === 'state_master_admin', 403, 'Only your state master admin can create an LGA sub-admin.');
            }
        }

        $tenantId = $tenant?->id ?? 1;
        $orgId = $tenant?->organisation_id ?? 1;
        $shortCode = $tenant?->short_code ?? 'EIP';
        $stateCode = DB::table('states')->where('id', $stateId)->value('iso_code') ?? 'NG';

        $user = DB::transaction(function () use ($data, $tenantId, $orgId, $shortCode, $stateId, $stateCode, $admin) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'phone'    => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'state_id' => $stateId,
                'lga_id'   => $data['lga_id'] ?? null,
                'status'   => 'active',
            ]);

            $supervisorId = ($admin->tenant_id !== null && (int)$admin->tenant_id === (int)$tenantId) ? $admin->id : null;

            $user->forceFill([
                'tenant_id'       => $tenantId,
                'organisation_id' => $orgId,
                'role_type'       => $data['role'],
                'user_code'       => UserCodeGenerator::generate($tenantId, $shortCode, $stateCode, $data['role']),
                'supervisor_id'   => $supervisorId,
                'created_by'      => $admin->id,
            ])->save();

            setPermissionsTeamId($tenantId);
            $user->assignRole($data['role']);

            if ($data['role'] === 'state_admin' && !empty($data['lga_id'])) {
                abort_unless((int) $admin->tenant_id === (int) $tenantId, 403, 'The state master admin must share the tenant to assign this LGA.');
                AdminLgaAssignment::query()->updateOrCreate(
                    ['tenant_id' => $tenantId, 'user_id' => $user->id, 'lga_id' => $data['lga_id']],
                    ['assigned_by' => $admin->id, 'is_active' => true, 'assigned_at' => now()]
                );
            }
            setPermissionsTeamId($admin->tenant_id ?? 0);

            return $user;
        });

        ActivityLog::record('user.created', 'User', (string) $user->id, [], array_diff_key($data, ['password' => true]));

        try {
            app(InboxService::class)->notify(
                $user,
                'Welcome to ElectionWatch',
                "{$admin->name} registered you as {$data['role']}. Your user code is {$user->user_code}.",
                ['type' => 'account_created', 'user_code' => $user->user_code],
                'high'
            );
        } catch (\Throwable $e) {
            // Inbox notification is non-fatal
        }

        return response()->json(['message' => 'User created.', 'user' => new UserResource($user->load(['state', 'lga']))], 201);
    }

    public function show(string $id)
    {
        $admin = request()->user();
        abort_unless($this->isSuperAdmin($admin) || $admin->can('users.view'), 403);

        $user = $this->scopeManagedUsers(User::with(['state', 'lga'])->withCount(['incidents', 'assignments', 'checkIns']), $admin)->findOrFail($id);

        return new UserResource($user);
    }

    public function update(Request $request, string $id)
    {
        $admin = $request->user();
        abort_unless($this->isSuperAdmin($admin) || $admin->can('users.update'), 403);

        $user = $this->scopeManagedUsers(User::query(), $admin)->findOrFail($id);

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'phone'    => ['nullable', 'string', 'max:30'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
        ]);

        $adminRole = $admin->role_type ?? $admin->getRoleNames()->first();
        if (in_array($adminRole, ['state_admin', 'state_master_admin'], true)) {
            if (array_key_exists('state_id', $data) && (int) $data['state_id'] !== (int) $admin->state_id) {
                throw ValidationException::withMessages(['state_id' => ['You can only keep users in your state.']]);
            }
            $data['state_id'] = $admin->state_id;
        }

        $old = $user->only(array_keys($data));
        $user->update($data);

        ActivityLog::record('user.updated', 'User', (string) $user->id, $old, $data);

        return response()->json(['message' => 'User updated.', 'user' => new UserResource($user->load('state'))]);
    }

    public function destroy(string $id)
    {
        $admin = request()->user();
        abort_unless($this->isSuperAdmin($admin) || $admin->can('users.delete'), 403);

        $user = $this->scopeManagedUsers(User::query(), $admin)->findOrFail($id);
        $user->delete();

        ActivityLog::record('user.deleted', 'User', (string) $id);

        return response()->json(['message' => 'User deleted.']);
    }

    public function suspend(string $id)
    {
        $admin = request()->user();
        abort_unless($this->isSuperAdmin($admin) || $admin->can('users.suspend'), 403);

        $user = $this->scopeManagedUsers(User::query(), $admin)->findOrFail($id);
        $newStatus = $user->status === 'suspended' ? 'active' : 'suspended';
        $user->update(['status' => $newStatus]);

        ActivityLog::record('user.' . $newStatus, 'User', (string) $user->id);

        return response()->json(['message' => "User {$newStatus}.", 'user' => new UserResource($user)]);
    }

    public function assignRole(Request $request, string $id)
    {
        $admin = $request->user();
        abort_unless($this->isSuperAdmin($admin) || $admin->can('users.assign-role'), 403);

        $data = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = $this->scopeManagedUsers(User::query(), $admin)->findOrFail($id);
        $user->syncRoles([$data['role']]);
        $user->update(['role_type' => $data['role']]);

        ActivityLog::record('user.role-assigned', 'User', (string) $user->id, [], $data);

        return response()->json(['message' => 'Role assigned.', 'user' => new UserResource($user)]);
    }
}
