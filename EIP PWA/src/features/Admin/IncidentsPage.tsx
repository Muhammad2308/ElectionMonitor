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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Incidents</h2>
          <p className="text-gray-400 text-sm">All incident reports across polling units.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description…"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm flex-1 min-w-[200px]"
          />
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
            <option value="">All severities</option>
            {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
            <option value="">All statuses</option>
            {['open', 'investigating', 'resolved', 'dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
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
