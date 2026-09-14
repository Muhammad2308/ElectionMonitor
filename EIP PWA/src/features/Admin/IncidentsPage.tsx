import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Badge } from '../../components/UI';
import { incidentsAPI } from './api';
import { getRelativeTime } from '../../utils/formatting';

const severityVariant: Record<string, 'danger' | 'warning' | 'default' | 'info'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  open: 'warning',
  investigating: 'info',
  resolved: 'success',
  dismissed: 'default',
};

export const IncidentsPage: React.FC = () => {
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const incidents = useQuery({
    queryKey: ['admin', 'incidents', severity, status, search],
    queryFn: () => incidentsAPI.list({
      severity: severity || undefined,
      status: status || undefined,
      search: search || undefined,
      limit: 50,
    }),
  });

  const list = incidents.data?.data ?? [];

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Incidents</h2>
          <p className="text-sm text-gray-400">All incident reports across polling units.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description…"
            className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white sm:min-w-50 sm:py-2"
          />
          <div className="flex gap-3">
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white sm:flex-initial sm:py-2">
              <option value="">All severities</option>
              {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white sm:flex-initial sm:py-2">
              <option value="">All statuses</option>
              {['open', 'investigating', 'resolved', 'dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800">
          <table className="w-full min-w-180 text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Polling Unit</th>
                <th className="text-left px-4 py-3">State</th>
                <th className="text-left px-4 py-3">Reporter</th>
                <th className="text-left px-4 py-3">Severity</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Reported</th>
              </tr>
            </thead>
            <tbody>
              {incidents.isLoading && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
              )}
              {!incidents.isLoading && list.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No incidents match these filters.</td></tr>
              )}
              {list.map((inc) => (
                <tr key={inc.id} className="border-t border-gray-700 hover:bg-gray-900/50">
                  <td className="px-4 py-3 text-white font-medium">{inc.category_name}</td>
                  <td className="px-4 py-3 text-gray-300">{inc.polling_unit?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{inc.polling_unit?.state ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{inc.reporter?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={severityVariant[inc.severity]}>{inc.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[inc.status]}>{inc.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{getRelativeTime(inc.incident_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IncidentsPage;
