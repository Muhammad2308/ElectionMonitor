<?php

namespace App\Modules\Assignments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Assignments\Models\ObserverAssignment;
use App\Modules\Authorization\GeographicScope;
use App\Modules\Inbox\Services\InboxService;
use App\Modules\ReferenceData\Models\PollingUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssignmentController extends Controller
{
    /**
     * Observers in the admin's own tenant. Other tenants' users are never returned.
     *
     * @param  array<int>  $ids
     * @return Collection<int, User>
     */
    private function tenantObservers(User $admin, array $ids): Collection
    {
        abort_if($admin->tenant_id === null, 403, 'No tenant context.');

        return User::query()
            ->whereIn('id', $ids)
            ->where('tenant_id', $admin->tenant_id)
            ->where('role_type', 'observer')
            ->where('status', 'active')
            ->get();
    }

    private function notifyAssigned(User $observer, PollingUnit $pollingUnit, string $electionDate): void
    {
        app(InboxService::class)->notify(
            $observer,
            'New polling unit assignment',
            "You are assigned to {$pollingUnit->name} ({$pollingUnit->pu_code}) for the election on {$electionDate}.",
            ['type' => 'assignment', 'polling_unit_id' => $pollingUnit->id, 'election_date' => $electionDate],
            'high'
        );
    }

    public function mine(Request $request)
    {
        $assignments = ObserverAssignment::with('pollingUnit.ward.lga.state')
            ->where('observer_id', $request->user()->id)
            ->orderByDesc('election_date')
            ->get();

        return response()->json(['data' => $assignments]);
    }

    public function index(Request $request)
    {
        $admin = $request->user();
        abort_unless($admin->can('assignments.view'), 403);

        $query = ObserverAssignment::with(['user', 'pollingUnit.ward.lga.state']);

        if (in_array($admin->role_type, ['state_master_admin', 'state_admin'], true)) {
            $allowedPollingUnitIds = app(GeographicScope::class)
                ->applyToPollingUnits(PollingUnit::query(), $admin)
                ->select('polling_units.id');
            $query->whereIn('polling_unit_id', $allowedPollingUnitIds);
            $query->where('tenant_id', $admin->tenant_id);
        } else {
            abort(403, 'This role cannot manage observer assignments.');
        }

        if ($request->filled('user_id')) {
            $query->where('observer_id', $request->integer('user_id'));
        }

        if ($request->filled('polling_unit_id')) {
            $query->where('polling_unit_id', $request->integer('polling_unit_id'));
        }

        if ($request->filled('election_date')) {
            $query->whereDate('election_date', $request->date('election_date'));
        }

        $assignments = $query->orderByDesc('election_date')->paginate($request->integer('limit', 20));

        return response()->json($assignments);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('assignments.manage'), 403);

        $data = $request->validate([
            'user_id'         => ['required', 'integer', 'exists:users,id'],
            'polling_unit_id' => ['required', 'integer', 'exists:polling_units,id'],
            'election_date'   => ['required', 'date'],
        ]);

        $admin = $request->user();
        abort_unless(in_array($admin->role_type, ['state_master_admin', 'state_admin'], true), 403);
        $observer = $this->tenantObservers($admin, [$data['user_id']])->first()
            ?? abort(422, 'That user is not an observer in your tenant.');
        abort_unless((int) $observer->state_id === (int) $admin->state_id, 422, 'That observer is outside your state.');
        $this->assertCanManageObservers($admin, collect([$observer]));

        $pollingUnit = app(GeographicScope::class)
            ->applyToPollingUnits(PollingUnit::query(), $admin)
            ->whereKey($data['polling_unit_id'])
            ->firstOrFail();
        $pollingUnit->loadMissing('ward');
        if ($observer->lga_id !== null && (int) $observer->lga_id !== (int) $pollingUnit->ward->lga_id) {
            throw ValidationException::withMessages(['polling_unit_id' => ['Choose a polling unit in the observer’s assigned LGA.']]);
        }

        $assignment = ObserverAssignment::query()->firstOrCreate([
            'tenant_id'       => $observer->tenant_id,
            'observer_id'     => $observer->id,
            'polling_unit_id' => $pollingUnit->id,
            'election_date'   => $data['election_date'],
        ], ['assigned_by' => $admin->id]);

        if ($assignment->wasRecentlyCreated) {
            $this->notifyAssigned($observer, $pollingUnit, $data['election_date']);
        }

        return response()->json(['message' => 'Assignment created.', 'assignment' => $assignment], 201);
    }

    public function bulk(Request $request)
    {
        abort_unless($request->user()->can('assignments.manage'), 403);

        $data = $request->validate([
            'election_date'      => ['required', 'date'],
            'assignments'        => ['required', 'array', 'min:1'],
            'assignments.*.user_id'         => ['required', 'integer', 'exists:users,id'],
            'assignments.*.polling_unit_id' => ['required', 'integer', 'exists:polling_units,id'],
        ]);

        $admin = $request->user();
        abort_unless(in_array($admin->role_type, ['state_master_admin', 'state_admin'], true), 403);
        $observers = $this->tenantObservers($admin, collect($data['assignments'])->pluck('user_id')->unique()->all())->keyBy('id');

        $missing = collect($data['assignments'])->pluck('user_id')->unique()->diff($observers->keys());
        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'assignments' => ['Users not in your tenant as observers: ' . $missing->implode(', ')],
            ]);
        }

        if ($observers->contains(fn (User $observer) => (int) $observer->state_id !== (int) $admin->state_id)) {
            throw ValidationException::withMessages(['assignments' => ['All observers must belong to your state.']]);
        }

        $this->assertCanManageObservers($admin, $observers);

        $pollingUnits = app(GeographicScope::class)
            ->applyToPollingUnits(PollingUnit::query(), $admin)
            ->with('ward')
            ->whereIn('polling_units.id', collect($data['assignments'])->pluck('polling_unit_id')->unique())
            ->get()
            ->keyBy('id');

        $requestedUnitIds = collect($data['assignments'])->pluck('polling_unit_id')->unique();
        if ($requestedUnitIds->diff($pollingUnits->keys())->isNotEmpty()) {
            throw ValidationException::withMessages(['assignments' => ['One or more polling units are outside your assigned area.']]);
        }

        foreach ($data['assignments'] as $row) {
            $observer = $observers[$row['user_id']];
            $pollingUnit = $pollingUnits[$row['polling_unit_id']];
            if ($observer->lga_id !== null && (int) $observer->lga_id !== (int) $pollingUnit->ward->lga_id) {
                throw ValidationException::withMessages(['assignments' => ['Each observer must be assigned to a polling unit in their LGA.']]);
            }
        }

        $rows = collect($data['assignments'])->map(fn ($row) => [
            'tenant_id'       => $observers[$row['user_id']]->tenant_id,
            'observer_id'     => $row['user_id'],
            'polling_unit_id' => $row['polling_unit_id'],
            'election_date'   => $data['election_date'],
            'assigned_by'     => $admin->id,
            'created_at'      => now(),
            'updated_at'      => now(),
        ])->all();

        $createdRows = DB::transaction(function () use ($rows) {
            $created = [];
            foreach ($rows as $row) {
                $assignment = ObserverAssignment::query()->firstOrCreate([
                    'tenant_id' => $row['tenant_id'],
                    'observer_id' => $row['observer_id'],
                    'polling_unit_id' => $row['polling_unit_id'],
                    'election_date' => $row['election_date'],
                ], ['assigned_by' => $row['assigned_by']]);
                if ($assignment->wasRecentlyCreated) {
                    $created[] = $row;
                }
            }
            return $created;
        });

        foreach ($createdRows as $row) {
            $this->notifyAssigned($observers[$row['observer_id']], $pollingUnits[$row['polling_unit_id']], $data['election_date']);
        }

        return response()->json(['message' => count($rows) . ' assignments created.'], 201);
    }

    public function destroy(string $id)
    {
        abort_unless(request()->user()->can('assignments.manage'), 403);

        $admin = request()->user();
        abort_unless(in_array($admin->role_type, ['state_master_admin', 'state_admin'], true), 403);
        $assignmentQuery = ObserverAssignment::query()->where('tenant_id', $admin->tenant_id);
        $allowedPollingUnitIds = app(GeographicScope::class)
            ->applyToPollingUnits(PollingUnit::query(), $admin)
            ->select('polling_units.id');
        $assignmentQuery->whereIn('polling_unit_id', $allowedPollingUnitIds);
        $assignment = $assignmentQuery->findOrFail($id);
        $assignment->delete();

        return response()->json(['message' => 'Assignment removed.']);
    }

    /** @param Collection<int, User> $observers */
    private function assertCanManageObservers(User $admin, Collection $observers): void
    {
        if ($admin->role_type !== 'state_admin') {
            return;
        }

        $assignedLgaIds = app(GeographicScope::class)->assignedLgaIds($admin) ?? collect();

        $supervisorIds = $observers->pluck('supervisor_id')->filter()->unique();
        $supervisors = User::query()
            ->whereIn('id', $supervisorIds)
            ->where('tenant_id', $admin->tenant_id)
            ->get(['id', 'role_type'])
            ->keyBy('id');

        $unauthorizedObserver = $observers->contains(function (User $observer) use ($admin, $supervisors, $assignedLgaIds) {
            $supervisor = $supervisors->get($observer->supervisor_id);
            return (int) $observer->supervisor_id !== (int) $admin->id
                && $supervisor?->role_type !== 'state_master_admin'
                && !($observer->lga_id !== null && $assignedLgaIds->contains((int) $observer->lga_id));
        });

        if ($unauthorizedObserver) {
            throw ValidationException::withMessages([
                'user_id' => ['You can manage observers assigned to you or to your state master admin.'],
            ]);
        }
    }
}
