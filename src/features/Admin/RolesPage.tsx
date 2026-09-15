import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Badge } from '../../components/UI';
import { rolesAPI, permissionsAPI } from './api';

export const RolesPage: React.FC = () => {
  const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: rolesAPI.list });
  const permissions = useQuery({ queryKey: ['admin', 'permissions'], queryFn: permissionsAPI.list });

  const resources = Array.from(new Set((permissions.data?.data ?? []).map((p) => p.resource)));

  return (
    <AdminLayout>
      <div className="animate-[eipFadeUp_0.6s_ease-out_both] max-w-7xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h2 className="font-black text-white tracking-tight" style={{ fontSize: '32px' }}>Roles &amp; Permissions</h2>
          <p className="font-medium text-slate-400" style={{ fontSize: '15px', marginTop: '6px' }}>
            {resources.length} permission groups across {roles.data?.data.length ?? 0} roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '32px' }}>
          {roles.isLoading && <p className="text-slate-500 font-medium">Loading roles…</p>}
          {roles.data?.data.map((role) => (
            <div key={role.id} className="rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300" style={{ padding: '32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '16px', gap: '8px' }}>
                <h3 className="truncate font-black capitalize text-white tracking-tight" style={{ fontSize: '22px' }}>{role.name.replace(/-/g, ' ')}</h3>
                <Badge className='px-2 py-1' variant="info">{role.users_count} user{role.users_count === 1 ? '' : 's'}</Badge>
              </div>
              <p className="font-bold uppercase tracking-widest text-slate-400" style={{ marginBottom: '24px', fontSize: '12px' }}>
                {role.permissions.length} permissions
              </p>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {role.permissions.slice(0, 8).map((p) => (
                  <span key={p} className="rounded-md border border-slate-700/60 bg-slate-900/50 text-slate-300 font-medium" style={{ padding: '6px 10px', fontSize: '11px' }}>
                    {p}
                  </span>
                ))}
                {role.permissions.length > 8 && (
                  <span className="font-medium text-slate-500" style={{ padding: '6px 10px', fontSize: '11px' }}>+{role.permissions.length - 8} more</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl" style={{ padding: '40px' }}>
          <h3 className="font-black text-white tracking-tight" style={{ marginBottom: '32px', fontSize: '24px' }}>All Permissions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {resources.map((resource) => (
              <div key={resource}>
                <p className="font-bold uppercase tracking-widest text-indigo-400" style={{ marginBottom: '16px', fontSize: '12px' }}>{resource}</p>
                <div className="flex flex-wrap" style={{ gap: '12px' }}>
                  {(permissions.data?.data ?? [])
                    .filter((p) => p.resource === resource)
                    .map((p) => (
                      <span key={p.id} className="rounded-lg border border-blue-500/20 bg-blue-600/10 text-blue-300 font-semibold" style={{ padding: '8px 16px', fontSize: '12px' }}>
                        {p.action}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RolesPage;
