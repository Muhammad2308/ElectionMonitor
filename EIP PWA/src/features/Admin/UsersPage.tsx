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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Observers &amp; Users</h2>
            <p className="text-gray-400 text-sm">Manage field observers, supervisors, and their roles.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ New User</Button>
        </div>

        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm flex-1"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="">All roles</option>
            {roles.data?.data.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">State</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Incidents</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.isLoading && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
              )}
              {!users.isLoading && list.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No users found.</td></tr>
              )}
              {list.map((u: AdminUser) => (
                <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-900/50">
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-300">{u.email}</td>
                  <td className="px-4 py-3 text-gray-300">{u.state_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{u.role ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{u.incidents_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[u.status] ?? 'default'}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-white mb-4">New User</h3>
        {error && <div className="mb-3 text-sm text-red-400 bg-red-950 border border-red-700/40 rounded-lg p-2">{error}</div>}
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); setError(null); createMutation.mutate(); }}
        >
          <input required placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input required type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input required type="password" placeholder="Temporary password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersPage;
