import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Badge, Button } from '../../components/UI';
import { usersAPI, rolesAPI, observerAssignmentsAPI, type AdminUser } from './api';
import api from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

const statusVariant: Record<string, 'success' | 'default' | 'danger'> = {
  active: 'success',
  inactive: 'default',
  suspended: 'danger',
};

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [assignmentTarget, setAssignmentTarget] = useState<{ user: AdminUser; mode: 'lga' | 'polling-unit' } | null>(null);
  const currentRole = useAuthStore((s) => s.user?.role);

  const users = useQuery({
    queryKey: ['admin', 'users', search, roleFilter],
    queryFn: () => usersAPI.list({ search: search || undefined, role: roleFilter || undefined }),
  });

  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: rolesAPI.list });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => usersAPI.suspend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const list = users.data?.data ?? [];
  const creatableRoles = (roles.data?.data ?? []).filter((r) => currentRole !== 'state_admin' || r.name === 'observer');

  return (
    <AdminLayout>
      <div className="animate-[eipFadeUp_0.6s_ease-out_both] max-w-7xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '24px' }}>
          <div>
            <h2 className="font-black text-white tracking-tight" style={{ fontSize: '32px' }}>Observers &amp; Users</h2>
            <p className="font-medium text-slate-400" style={{ fontSize: '15px', marginTop: '6px' }}>Manage field observers, supervisors, and their roles.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto" style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 'bold' }}>+ New User</Button>
        </div>

        <div className="flex flex-col sm:flex-row" style={{ gap: '16px' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/60 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            style={{ padding: '14px 20px', fontSize: '15px' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
            style={{ padding: '14px 20px', fontSize: '15px', minWidth: '200px' }}
          >
            <option value="">All roles</option>
            {roles.data?.data.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
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
              {!users.isLoading && list.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 font-medium" style={{ padding: '40px' }}>No users found.</td></tr>
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
      </div>

      {showCreate && (
        <CreateUserModal
          roles={creatableRoles}
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

type Choice = { id: number; name: string };

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
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

  const lgasQuery = useQuery({
    queryKey: ['assignment-options', 'lgas'],
    queryFn: async () => asArray<Choice>(await api.get('/geography/lgas')),
  });
  const lgas = lgasQuery.data ?? [];

  useEffect(() => {
    if (!selectedLgaId && lgas.length > 0) setSelectedLgaId(String(lgas[0].id));
  }, [lgas, selectedLgaId]);

  const assignedLgasQuery = useQuery({
    queryKey: ['admin', 'users', user.id, 'lga-assignments'],
    queryFn: () => usersAPI.lgaAssignments(user.id),
    enabled: mode === 'lga',
  });
  const pollingUnitsQuery = useQuery({
    queryKey: ['assignment-options', 'polling-units', selectedLgaId],
    queryFn: async () => asArray<Choice>(await api.get('/geography/polling-units', {
      params: { lga_id: Number(selectedLgaId), all: true },
    })),
    enabled: mode === 'polling-unit' && Boolean(selectedLgaId),
  });

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
              <select value={selectedLgaId} onChange={(e) => setSelectedLgaId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white">
                <option value="">Select an LGA</option>
                {lgas.map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </select>
            </label>
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
              <select value={selectedLgaId} onChange={(e) => { setSelectedLgaId(e.target.value); setSelectedPuId(''); }} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white">
                {lgas.map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              Polling unit
              <select required value={selectedPuId} onChange={(e) => setSelectedPuId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white">
                <option value="">{pollingUnitsQuery.isLoading ? 'Loading polling units…' : 'Select a polling unit'}</option>
                {(pollingUnitsQuery.data ?? []).map((pu) => <option key={pu.id} value={pu.id}>{pu.name}</option>)}
              </select>
            </label>
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
  onClose: () => void;
  onCreated: () => void;
}> = ({ roles, onClose, onCreated }) => {
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: string; state_id?: number }>({
    name: '',
    email: '',
    password: '',
    role: roles[0]?.name ?? 'observer',
    state_id: undefined,
  });
  const [error, setError] = useState<string | null>(null);

  const states = useQuery({
    queryKey: ['geography', 'states'],
    queryFn: () => api.get<any[]>('/geography/states'),
  });

  const stateList = Array.isArray(states.data) ? states.data : (states.data as any)?.data || [];

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
          <select
            value={form.state_id ?? ''}
            onChange={(e) => setForm({ ...form, state_id: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all capitalize" style={{ padding: '14px 16px', fontSize: '15px' }}
          >
            <option value="">Select State (Optional)</option>
            {stateList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" style={{ padding: '14px 16px', fontSize: '15px' }}>
            {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>

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
