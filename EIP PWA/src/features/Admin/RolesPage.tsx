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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Roles &amp; Permissions</h2>
          <p className="text-gray-400 text-sm">
            {resources.length} permission groups across {roles.data?.data.length ?? 0} roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.isLoading && <p className="text-gray-500">Loading roles…</p>}
          {roles.data?.data.map((role) => (
            <div key={role.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white capitalize">{role.name.replace(/-/g, ' ')}</h3>
                <Badge variant="info">{role.users_count} user{role.users_count === 1 ? '' : 's'}</Badge>
              </div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                {role.permissions.length} permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 8).map((p) => (
                  <span key={p} className="text-xs px-2 py-1 rounded bg-gray-900 text-gray-300 border border-gray-700">
                    {p}
                  </span>
                ))}
                {role.permissions.length > 8 && (
                  <span className="text-xs px-2 py-1 text-gray-500">+{role.permissions.length - 8} more</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">All Permissions</h3>
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource}>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">{resource}</p>
                <div className="flex flex-wrap gap-2">
                  {(permissions.data?.data ?? [])
                    .filter((p) => p.resource === resource)
                    .map((p) => (
                      <span key={p.id} className="text-xs px-2 py-1 rounded-full bg-blue-950 text-blue-200 border border-blue-800/40">
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
