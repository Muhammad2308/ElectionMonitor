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
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Roles &amp; Permissions</h2>
          <p className="text-sm text-gray-400">
            {resources.length} permission groups across {roles.data?.data.length ?? 0} roles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.isLoading && <p className="text-gray-500">Loading roles…</p>}
          {roles.data?.data.map((role) => (
            <div key={role.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="truncate text-base font-bold capitalize text-white sm:text-lg">{role.name.replace(/-/g, ' ')}</h3>
                <Badge variant="info">{role.users_count} user{role.users_count === 1 ? '' : 's'}</Badge>
              </div>
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">
                {role.permissions.length} permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 8).map((p) => (
                  <span key={p} className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-300">
                    {p}
                  </span>
                ))}
                {role.permissions.length > 8 && (
                  <span className="px-2 py-1 text-xs text-gray-500">+{role.permissions.length - 8} more</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-white sm:text-lg">All Permissions</h3>
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource}>
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">{resource}</p>
                <div className="flex flex-wrap gap-2">
                  {(permissions.data?.data ?? [])
                    .filter((p) => p.resource === resource)
                    .map((p) => (
                      <span key={p.id} className="rounded-full border border-blue-800/40 bg-blue-950 px-2 py-1 text-xs text-blue-200">
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
