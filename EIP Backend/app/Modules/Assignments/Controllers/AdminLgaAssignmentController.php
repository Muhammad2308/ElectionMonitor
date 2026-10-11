<?php

namespace App\Modules\Assignments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Assignments\Models\AdminLgaAssignment;
use App\Modules\ReferenceData\Models\Lga;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminLgaAssignmentController extends Controller
{
    public function index(Request $request, int $userId)
    {
        $admin = $request->user();
        abort_unless($admin->role_type === 'state_master_admin', 403, 'Only the state master admin can assign LGAs.');

        $target = $this->stateAdminInTenant($admin, $userId);
        $assignments = AdminLgaAssignment::query()
            ->active()
            ->where('tenant_id', $admin->tenant_id)
            ->where('user_id', $target->id)
            ->with('lga:id,state_id,name')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $assignments]);
    }

    public function store(Request $request, int $userId)
    {
        $admin = $request->user();
        abort_unless($admin->role_type === 'state_master_admin', 403, 'Only the state master admin can assign LGAs.');
        $target = $this->stateAdminInTenant($admin, $userId);

        $data = $request->validate([
            'lga_id' => ['required', 'integer', 'exists:lgas,id'],
        ]);

        $lga = Lga::query()->whereKey($data['lga_id'])->firstOrFail();
        if ((int) $lga->state_id !== (int) $admin->state_id || (int) $target->state_id !== (int) $admin->state_id) {
            throw ValidationException::withMessages([
                'lga_id' => ['The selected LGA and sub-admin must belong to your state.'],
            ]);
        }

        AdminLgaAssignment::query()->updateOrCreate(
            [
                'tenant_id' => $admin->tenant_id,
                'user_id' => $target->id,
                'lga_id' => $lga->id,
            ],
            [
                'assigned_by' => $admin->id,
                'is_active' => true,
                'assigned_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'LGA assigned to sub-admin.',
            'assignment' => AdminLgaAssignment::query()
                ->where('tenant_id', $admin->tenant_id)
                ->where('user_id', $target->id)
                ->where('lga_id', $lga->id)
                ->with('lga:id,state_id,name')
                ->firstOrFail(),
        ], 201);
    }

    public function destroy(Request $request, int $userId, int $lgaId)
    {
        $admin = $request->user();
        abort_unless($admin->role_type === 'state_master_admin', 403, 'Only the state master admin can remove LGA assignments.');
        $target = $this->stateAdminInTenant($admin, $userId);

        $assignment = AdminLgaAssignment::query()
            ->where('tenant_id', $admin->tenant_id)
            ->where('user_id', $target->id)
            ->where('lga_id', $lgaId)
            ->firstOrFail();
        $assignment->update(['is_active' => false]);

        return response()->json(['message' => 'LGA assignment removed.']);
    }

    private function stateAdminInTenant(User $admin, int $userId): User
    {
        return User::query()
            ->where('id', $userId)
            ->where('tenant_id', $admin->tenant_id)
            ->where('state_id', $admin->state_id)
            ->where('role_type', 'state_admin')
            ->firstOrFail();
    }
}
