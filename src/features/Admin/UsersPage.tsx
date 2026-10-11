import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Badge, Button } from '../../components/UI';
import { usersAPI, rolesAPI, observerAssignmentsAPI, type AdminUser } from './api';
import api from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { geographyAPI, type GeoLga, type GeoPollingUnit } from '../PollingUnits/api';

const statusVariant: Record<string, 'success' | 'default' | 'danger'> = {
  active: 'success',
  inactive: 'default',
  suspended: 'danger',
};

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [assignmentTarget, setAssignmentTarget] = useState<{ user: AdminUser; mode: 'lga' | 'polling-unit' } | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const currentRole = currentUser?.role ?? currentUser?.role_type;
  const isStateAdmin = currentRole === 'state_admin';
  const isStateScoped = isStateAdmin || currentRole === 'state_master_admin';

  const users = useQuery({
    queryKey: ['admin', 'users', search, roleFilter, statusFilter, page, currentRole, currentUser?.state_id],
    queryFn: () => usersAPI.list({ search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined, state_id: currentUser?.state_id ?? undefined, page }),
  });

  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: rolesAPI.list });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => usersAPI.suspend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const list = (users.data?.data ?? []).filter((user) => !isStateScoped || user.state_id === currentUser?.state_id);
  const stateAdminRoles = ['observer', 'state_admin', 'state_master_admin'];
  const creatableRoles = (roles.data?.data ?? []).filter((r) => {
    if (currentRole === 'state_admin') return r.name === 'observer';
    if (currentRole === 'state_master_admin') return stateAdminRoles.includes(r.name);
    return true;
  });
  const visibleRoles = isStateAdmin ? (roles.data?.data ?? []).filter((r) => r.name === 'observer') : roles.data?.data ?? [];
  const stateName = currentUser?.state_name ?? 'your state';
  const totalUsers = users.data?.meta?.total ?? users.data?.total ?? list.length;
  const currentPage = users.data?.meta?.current_page ?? users.data?.current_page ?? page;
  const lastPage = users.data?.meta?.last_page ?? users.data?.last_page ?? 1;

  return (
    <AdminLayout>
      <div className="animate-[eipFadeUp_0.6s_ease-out_both] max-w-7xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '24px' }}>
          <div>
            <h2 className="font-black text-white tracking-tight" style={{ fontSize: '32px' }}>Observers &amp; Users</h2>
            <p className="font-medium text-slate-400" style={{ fontSize: '15px', marginTop: '6px' }}>
              {isStateScoped ? `Manage observers and assignments in ${stateName}.` : 'Manage field observers, supervisors, and their roles.'}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto" style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 'bold' }}>+ {isStateAdmin ? 'Add Observer' : 'New User'}</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px_180px_200px]">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/60 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            style={{ padding: '14px 20px', fontSize: '15px' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
            style={{ padding: '14px 20px', fontSize: '15px', minWidth: '200px' }}
          >
            <option value="">{isStateAdmin ? 'All observers' : 'All roles'}</option>
            {visibleRoles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter by status"
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 text-white focus:outline-none focus:border-blue-500/50"
            style={{ padding: '14px 20px' }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <div className="flex items-center rounded-xl border border-slate-700/50 bg-slate-800/60 px-5 text-sm font-semibold text-slate-300">
            State: <span className="ml-1 text-white">{isStateScoped ? stateName : 'All states'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Users in view</div><div className="mt-1 text-2xl font-black text-white">{users.isLoading ? '—' : totalUsers}</div></div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Active</div><div className="mt-1 text-2xl font-black text-emerald-400">{users.isLoading ? '—' : list.filter((u) => u.status === 'active').length}</div></div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Scope</div><div className="mt-1 text-lg font-black text-blue-300">{isStateScoped ? stateName : 'All states'}</div></div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: '12px' }}>
              <tr>
                <th style={{ padding: '24px' }}>Name</th>
                <th style={{ padding: '24px' }}>Email</th>
                <th style={{ padding: '24px' }}>State</th>
                <th style={{ padding: '24px' }}>Role</th>
                <th style={{ padding: '24px' }}>Incidents</th>
                <th style={{ padding: '24px' }}>Status</th>
                <th style={{ padding: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {users.isLoading && (
                <tr><td colSpan={7} className="text-center text-slate-500 font-medium" style={{ padding: '40px' }}>Loading…</td></tr>
              )}
              {users.isError && <tr><td colSpan={7} className="text-center text-red-300 font-medium" style={{ padding: '40px' }}>Could not load users. Refresh the page or check your access.</td></tr>}
              {!users.isLoading && !users.isError && list.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 font-medium" style={{ padding: '40px' }}>No users found in {isStateScoped ? stateName : 'this view'}.</td></tr>
              )}
              {list.map((u: AdminUser) => (
                <tr key={u.id} className="hover:bg-slate-800/60 transition-colors duration-150">
                  <td className="text-white font-bold" style={{ padding: '20px 24px', fontSize: '15px' }}>{u.name}</td>
                  <td className="text-slate-300 font-medium" style={{ padding: '20px 24px', fontSize: '14px' }}>{u.email}</td>
                  <td className="text-slate-300 font-medium capitalize" style={{ padding: '20px 24px', fontSize: '14px' }}>{u.state_name ?? '—'}</td>
                  <td className="text-slate-300 font-medium capitalize" style={{ padding: '20px 24px', fontSize: '14px' }}>{u.role ?? '—'}</td>
                  <td className="text-slate-300 font-bold" style={{ padding: '20px 24px', fontSize: '15px' }}>{u.incidents_count ?? 0}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <Badge variant={statusVariant[u.status] ?? 'default'}>{u.status}</Badge>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div className="flex flex-wrap gap-2">
                      {currentRole === 'state_master_admin' && u.role === 'state_admin' && (
                        <Button size="sm" variant="secondary" onClick={() => setAssignmentTarget({ user: u, mode: 'lga' })}>
                          Assign LGA
                        </Button>
                      )}
                      {(currentRole === 'state_master_admin' || currentRole === 'state_admin') && u.role === 'observer' && (
                        <Button size="sm" variant="secondary" onClick={() => setAssignmentTarget({ user: u, mode: 'polling-unit' })}>
                          Assign polling unit
                        </Button>
                      )}
                      {currentRole === 'state_master_admin' && (
                        <Button
                          size="sm"
                          variant={u.status === 'suspended' ? 'success' : 'danger'}
                          isLoading={suspendMutation.isPending && suspendMutation.variables === u.id}
                          onClick={() => suspendMutation.mutate(u.id)}
                        >
                          {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lastPage > 1 && <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {currentPage} of {lastPage} · {totalUsers} users</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={currentPage <= 1 || users.isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={currentPage >= lastPage || users.isFetching} onClick={() => setPage((value) => Math.min(lastPage, value + 1))}>Next</Button>
          </div>
        </div>}
      </div>

      {showCreate && (
        <CreateUserModal
          roles={creatableRoles}
          lockedStateId={isStateScoped ? currentUser?.state_id ?? undefined : undefined}
          lockedStateName={currentUser?.state_name ?? undefined}
          lockRole={isStateAdmin}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />
      )}
      {assignmentTarget && (
        <AssignmentModal
          user={assignmentTarget.user}
          mode={assignmentTarget.mode}
          onClose={() => setAssignmentTarget(null)}
          onSuccess={() => {
            setAssignmentTarget(null);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
          }}
        />
      )}
    </AdminLayout>
  );
};

const modalError = (error: any): string => {
  const errors = error?.response?.data?.errors;
  const first = errors ? Object.values(errors)[0] as string[] | undefined : undefined;
  return first?.[0] ?? error?.response?.data?.message ?? 'The assignment could not be saved.';
};

const AssignmentModal: React.FC<{
  user: AdminUser;
  mode: 'lga' | 'polling-unit';
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, mode, onClose, onSuccess }) => {
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedLgaId, setSelectedLgaId] = useState('');
  const [selectedPuId, setSelectedPuId] = useState('');
  const [electionDate, setElectionDate] = useState(localToday);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLgaId('');
    setSelectedPuId('');
  }, [user.id, mode]);

  const lgasQuery = useQuery({
    queryKey: ['assignment-options', 'lgas', user.state_id, user.id, mode],
    queryFn: () => geographyAPI.lgas(),
  });
  const lgas = (lgasQuery.data ?? []).filter((lga: GeoLga) => lga.state_id === user.state_id);

  const assignedLgasQuery = useQuery({
    queryKey: ['admin', 'users', user.id, 'lga-assignments'],
    queryFn: () => usersAPI.lgaAssignments(user.id),
    enabled: mode === 'lga',
  });
  const pollingUnitsQuery = useQuery({
    queryKey: ['assignment-options', 'polling-units', user.state_id, selectedLgaId, user.id],
    queryFn: () => geographyAPI.pollingUnits({ lga_id: Number(selectedLgaId), all: true }),
    enabled: mode === 'polling-unit' && Boolean(selectedLgaId),
  });
  const pollingUnits = (pollingUnitsQuery.data?.data ?? []).filter((pu: GeoPollingUnit) => pu.lga_id === Number(selectedLgaId));

  const lgaMutation = useMutation({
    mutationFn: (lgaId: number) => usersAPI.assignLga(user.id, lgaId),
    onSuccess: () => {
      setError(null);
      void assignedLgasQuery.refetch();
    },
    onError: (err) => setError(modalError(err)),
  });
  const removeLgaMutation = useMutation({
    mutationFn: (lgaId: number) => usersAPI.removeLga(user.id, lgaId),
    onSuccess: () => {
      setError(null);
      void assignedLgasQuery.refetch();
    },
    onError: (err) => setError(modalError(err)),
  });
  const pollingUnitMutation = useMutation({
    mutationFn: () => observerAssignmentsAPI.create({
      user_id: user.id,
      polling_unit_id: Number(selectedPuId),
      election_date: electionDate,
    }),
    onSuccess,
    onError: (err) => setError(modalError(err)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="presentation">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700/50 bg-slate-900 shadow-2xl p-6 sm:p-8" role="dialog" aria-modal="true">
        <h3 className="text-2xl font-black text-white">{mode === 'lga' ? 'Assign political LGA' : 'Assign polling unit'}</h3>
        <p className="mt-2 mb-6 text-sm text-slate-400">For {user.name} · {user.state_name ?? 'Assigned state'}</p>
        {error && <div className="mb-4 rounded-xl border border-red-700/40 bg-red-950/50 p-3 text-sm text-red-300">{error}</div>}

        {mode === 'lga' ? (
          <div className="space-y-5">
            <label className="block text-sm font-semibold text-slate-300">
              Political LGA
              <select value={selectedLgaId} onChange={(e) => setSelectedLgaId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white" disabled={lgasQuery.isLoading || lgas.length === 0}>
                <option value="">Select an LGA</option>
                {lgas.map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </select>
            </label>
            {lgasQuery.isLoading && <p className="text-sm text-slate-400">Loading LGAs for {user.state_name ?? 'this state'}…</p>}
            {!lgasQuery.isLoading && !lgasQuery.isError && lgas.length === 0 && <p className="rounded-xl bg-amber-950/30 p-3 text-sm text-amber-200">No LGAs are available in {user.state_name ?? 'this state'} for your account.</p>}
            <Button
              disabled={!selectedLgaId || lgaMutation.isPending}
              isLoading={lgaMutation.isPending}
              onClick={() => { setError(null); lgaMutation.mutate(Number(selectedLgaId)); }}
            >Add LGA access</Button>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Assigned LGAs</h4>
              {assignedLgasQuery.isLoading ? <p className="text-sm text-slate-400">Loading assignments…</p> : (
                <div className="space-y-2">
                  {(assignedLgasQuery.data?.data ?? []).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-xl bg-slate-800/70 px-3 py-2">
                      <span className="text-sm text-white">{assignment.lga?.name ?? `LGA ${assignment.lga_id}`}</span>
                      <Button size="sm" variant="danger" isLoading={removeLgaMutation.isPending && removeLgaMutation.variables === assignment.lga_id} onClick={() => removeLgaMutation.mutate(assignment.lga_id)}>Remove</Button>
                    </div>
                  ))}
                  {!assignedLgasQuery.data?.data.length && <p className="text-sm text-slate-500">No LGAs assigned yet.</p>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setError(null); pollingUnitMutation.mutate(); }}>
            <label className="block text-sm font-semibold text-slate-300">
              Political LGA
              <select required value={selectedLgaId} onChange={(e) => { setSelectedLgaId(e.target.value); setSelectedPuId(''); }} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white" disabled={lgasQuery.isLoading || lgas.length === 0}>
                <option value="">Select an LGA</option>
                {lgas.map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </select>
            </label>
            {lgasQuery.isLoading && <p className="text-sm text-slate-400">Loading LGAs for {user.state_name ?? 'this state'}…</p>}
            {!lgasQuery.isLoading && !lgasQuery.isError && lgas.length === 0 && <p className="rounded-xl bg-amber-950/30 p-3 text-sm text-amber-200">No assigned LGAs are available for this account. Ask the state master admin to assign an LGA before assigning observers.</p>}
            <label className="block text-sm font-semibold text-slate-300">
              Polling unit
              <select required value={selectedPuId} onChange={(e) => setSelectedPuId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white" disabled={!selectedLgaId || pollingUnitsQuery.isLoading || pollingUnits.length === 0}>
                <option value="">{!selectedLgaId ? 'Select an LGA first' : pollingUnitsQuery.isLoading ? 'Loading polling units…' : 'Select a polling unit'}</option>
                {pollingUnits.map((pu) => <option key={pu.id} value={pu.id}>{pu.name} {pu.pu_code ? `(${pu.pu_code})` : ''}</option>)}
              </select>
            </label>
            {selectedLgaId && !pollingUnitsQuery.isLoading && !pollingUnitsQuery.isError && pollingUnits.length === 0 && <p className="text-sm text-amber-200">No polling units were found for the selected LGA.</p>}
            <label className="block text-sm font-semibold text-slate-300">
              Election date
              <input required type="date" value={electionDate} onChange={(e) => setElectionDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white" />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" isLoading={pollingUnitMutation.isPending} disabled={!selectedPuId}>Assign observer</Button>
            </div>
          </form>
        )}

        {mode === 'lga' && <div className="mt-6 flex justify-end"><Button type="button" variant="secondary" onClick={onClose}>Done</Button></div>}
        {(lgasQuery.isError || pollingUnitsQuery.isError || assignedLgasQuery.isError) && !error && (
          <p className="mt-4 text-sm text-amber-300">Could not load assignment options. Refresh and try again.</p>
        )}
      </div>
    </div>
  );
};

const CreateUserModal: React.FC<{
  roles: { id: number; name: string }[];
  lockedStateId?: number;
  lockedStateName?: string;
  lockRole?: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = ({ roles, lockedStateId, lockedStateName, lockRole = false, onClose, onCreated }) => {
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: string; state_id?: number }>({
    name: '',
    email: '',
    password: '',
    role: roles[0]?.name ?? 'observer',
    state_id: lockedStateId,
  });
  const [error, setError] = useState<string | null>(null);

  const states = useQuery({
    queryKey: ['geography', 'states'],
    queryFn: () => api.get<any[]>('/geography/states'),
    enabled: !lockedStateId,
  });

  const stateList = Array.isArray(states.data) ? states.data : (states.data as any)?.data || [];

  useEffect(() => {
    setForm((current) => ({ ...current, state_id: lockedStateId ?? current.state_id, role: lockRole ? 'observer' : current.role }));
  }, [lockedStateId, lockRole]);

  const createMutation = useMutation({
    mutationFn: () => usersAPI.create(form),
    onSuccess: onCreated,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to create user.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/50 bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ padding: '32px' }}>
        <h3 className="font-black text-white tracking-tight" style={{ fontSize: '24px', marginBottom: '24px' }}>New User</h3>
        {error && <div className="text-red-400 bg-red-950/50 border border-red-700/40 rounded-xl font-medium" style={{ padding: '12px 16px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
        <form
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          onSubmit={(e) => { e.preventDefault(); setError(null); createMutation.mutate(); }}
        >
          <input required placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" style={{ padding: '14px 16px', fontSize: '15px' }} />
          <input required type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" style={{ padding: '14px 16px', fontSize: '15px' }} />
          <input required type="password" placeholder="Temporary password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" style={{ padding: '14px 16px', fontSize: '15px' }} />
          {lockedStateId ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200">State: <strong>{lockedStateName ?? stateList.find((s: any) => s.id === lockedStateId)?.name ?? 'Assigned state'}</strong></div>
          ) : <select
            value={form.state_id ?? ''}
            onChange={(e) => setForm({ ...form, state_id: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all capitalize" style={{ padding: '14px 16px', fontSize: '15px' }}
          >
            <option value="">Select State (Optional)</option>
            {stateList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>}

          {lockRole ? <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200">Role: <strong>Observer</strong></div> : <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" style={{ padding: '14px 16px', fontSize: '15px' }}>
            {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>}

          <div className="flex justify-end" style={{ gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ padding: '12px 24px', fontWeight: 'bold' }}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending} style={{ padding: '12px 24px', fontWeight: 'bold' }}>Create User</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersPage;
