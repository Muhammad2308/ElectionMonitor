import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Badge, Button } from '../../components/UI';
import { usersAPI, rolesAPI, type AdminUser } from './api';

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
                    <Button
                      size="sm"
                      variant={u.status === 'suspended' ? 'success' : 'danger'}
                      isLoading={suspendMutation.isPending && suspendMutation.variables === u.id}
                      onClick={() => suspendMutation.mutate(u.id)}
                    >
                      {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          roles={roles.data?.data ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />
      )}
    </AdminLayout>
  );
};

const CreateUserModal: React.FC<{
  roles: { id: number; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ roles, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: roles[0]?.name ?? 'observer' });
  const [error, setError] = useState<string | null>(null);

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
