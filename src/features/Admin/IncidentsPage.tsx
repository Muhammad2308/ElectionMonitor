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
      <div className="animate-[eipFadeUp_0.6s_ease-out_both] max-w-7xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h2 className="font-black text-white tracking-tight" style={{ fontSize: '32px' }}>Incidents</h2>
          <p className="font-medium text-slate-400" style={{ fontSize: '15px', marginTop: '6px' }}>All incident reports across polling units.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap" style={{ gap: '16px' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description…"
            className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/60 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            style={{ padding: '14px 20px', fontSize: '15px', minWidth: '240px' }}
          />
          <div className="flex sm:flex-row flex-col" style={{ gap: '16px', flex: '1 1 auto' }}>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/60 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
              style={{ padding: '14px 20px', fontSize: '15px' }}>
              <option value="">All severities</option>
              {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/60 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer"
              style={{ padding: '14px 20px', fontSize: '15px' }}>
              <option value="">All statuses</option>
              {['open', 'investigating', 'resolved', 'dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: '12px' }}>
              <tr>
                <th style={{ padding: '24px' }}>Category</th>
                <th style={{ padding: '24px' }}>Polling Unit</th>
                <th style={{ padding: '24px' }}>State</th>
                <th style={{ padding: '24px' }}>Reporter</th>
                <th style={{ padding: '24px' }}>Party</th>
                <th style={{ padding: '24px' }}>Severity</th>
                <th style={{ padding: '24px' }}>Status</th>
                <th style={{ padding: '24px' }}>Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {incidents.isLoading && (
                <tr><td colSpan={8} className="text-center text-slate-500 font-medium" style={{ padding: '40px' }}>Loading…</td></tr>
              )}
              {!incidents.isLoading && list.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-500 font-medium" style={{ padding: '40px' }}>No incidents match these filters.</td></tr>
              )}
              {list.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/60 transition-colors duration-150">
                  <td className="text-white font-bold" style={{ padding: '20px 24px', fontSize: '15px' }}>{inc.category_name}</td>
                  <td className="text-slate-300 font-medium" style={{ padding: '20px 24px', fontSize: '14px' }}>{inc.polling_unit?.name ?? '—'}</td>
                  <td className="text-slate-300 font-medium capitalize" style={{ padding: '20px 24px', fontSize: '14px' }}>{inc.polling_unit?.state ?? '—'}</td>
                  <td className="text-slate-300 font-medium" style={{ padding: '20px 24px', fontSize: '14px' }}>{inc.reporter?.name ?? '—'}</td>
                  <td className="text-slate-300 font-bold" style={{ padding: '20px 24px', fontSize: '14px' }}>{inc.involving_party ?? '—'}</td>
                  <td style={{ padding: '20px 24px' }}><Badge variant={severityVariant[inc.severity]}>{inc.severity}</Badge></td>
                  <td style={{ padding: '20px 24px' }}><Badge variant={statusVariant[inc.status]}>{inc.status}</Badge></td>
                  <td className="text-slate-500 font-medium" style={{ padding: '20px 24px', fontSize: '13px' }}>{getRelativeTime(inc.incident_time)}</td>
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
