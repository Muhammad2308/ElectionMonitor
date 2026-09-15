import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList, Eye, AlertTriangle, Building2 } from 'lucide-react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { MetricsGrid } from '../../components/Dashboard/MetricCard';
import { dashboardAPI } from './api';
import { getRelativeTime } from '../../utils/formatting';

const severityDot: Record<string, string> = {
  critical: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  high: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
  medium: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
  low: 'bg-slate-400',
};

export const AdminDashboard: React.FC = () => {
  const metrics = useQuery({ queryKey: ['dashboard', 'metrics'], queryFn: dashboardAPI.getMetrics, refetchInterval: 30_000 });
  const incidents = useQuery({ queryKey: ['dashboard', 'incidents'], queryFn: () => dashboardAPI.getIncidents(6), refetchInterval: 30_000 });
  const activity = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: () => dashboardAPI.getActivity(6), refetchInterval: 30_000 });
  const chart = useQuery({ queryKey: ['dashboard', 'activity-chart'], queryFn: dashboardAPI.getActivityChart, refetchInterval: 60_000 });

  if (metrics.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center text-slate-400 sm:h-96">
            <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <p>Loading dashboard…</p>
            </div>
        </div>
      </AdminLayout>
    );
  }

  if (metrics.isError) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-red-700/50 bg-red-950/30 backdrop-blur-md p-4 sm:p-6 shadow-xl">
          <p className="text-sm text-red-400 sm:text-base">Failed to load dashboard metrics. Is the API reachable?</p>
        </div>
      </AdminLayout>
    );
  }

  const m = metrics.data!;

  const metricCards = [
    {
      icon: <ClipboardList size={20} aria-hidden="true" />,
      value: m.total_incidents,
      label: 'Total Incidents',
      subtitle: `+${m.incidents_last_hour} this hour`,
      variant: 'default' as const,
    },
    {
      icon: <Eye size={20} aria-hidden="true" />,
      value: m.active_observers,
      label: 'Active Observers',
      subtitle: `of ${m.deployed_observers} deployed`,
      variant: 'success' as const,
    },
    {
      icon: <AlertTriangle size={20} aria-hidden="true" />,
      value: m.open_incidents,
      label: 'Open Incidents',
      subtitle: `${m.critical_incidents} critical`,
      variant: 'warning' as const,
    },
    {
      icon: <Building2 size={20} aria-hidden="true" />,
      value: m.polling_units.toLocaleString(),
      label: 'Polling Units',
      subtitle: `${m.coverage_percentage}% covered`,
      variant: 'info' as const,
    },
  ];

  return (
    <AdminLayout>
      <div className="animate-[eipFadeUp_0.6s_ease-out_both] max-w-7xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Compact page title — desktop shows the full Header instead */}
        <div className="lg:hidden" style={{ marginBottom: '24px' }}>
          <h2 className="font-black text-white tracking-tight" style={{ fontSize: '30px' }}>Dashboard</h2>
          <p className="font-medium text-slate-400" style={{ fontSize: '14px', marginTop: '4px' }}>Live monitoring overview</p>
        </div>

        <MetricsGrid metrics={metricCards} />

        <div className="rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 className="font-black text-white tracking-tight" style={{ fontSize: '24px' }}>Incident &amp; Check-in Activity</h3>
            <p className="font-medium text-slate-400" style={{ fontSize: '14px', marginTop: '4px' }}>Today, hourly breakdown</p>
          </div>

          <div style={{ height: '320px' }}>
            {chart.data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data.data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="checkinsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} interval={3} tickMargin={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} width={32} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                        background: 'rgba(15, 23, 42, 0.95)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '16px', 
                        fontSize: '13px',
                        padding: '12px 16px',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }} 
                    itemStyle={{ color: '#f8fafc', fontWeight: 600, padding: '4px 0' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                  />
                  <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={3} fill="url(#incidentsGrad)" name="Incidents" />
                  <Area type="monotone" dataKey="checkins" stroke="#3b82f6" strokeWidth={3} fill="url(#checkinsGrad)" name="Check-ins" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '32px' }}>
          <div className="rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl" style={{ padding: '32px' }}>
            <h3 className="font-black text-white tracking-tight" style={{ fontSize: '20px', marginBottom: '24px' }}>Recent Incidents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {incidents.data?.data.length ? incidents.data.data.map((item) => (
                <div key={item.id} className="flex items-start rounded-2xl bg-slate-900/40 border border-slate-700/30 hover:bg-slate-800/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{ padding: '20px', gap: '16px' }}>
                  <div className={`shrink-0 rounded-full ${severityDot[item.severity || 'low']}`} style={{ width: '14px', height: '14px', marginTop: '6px' }}></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-100" style={{ fontSize: '16px' }}>{item.title}</p>
                    <p className="font-medium text-slate-400" style={{ fontSize: '14px', marginTop: '4px' }}>{getRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              )) : <p className="font-medium text-slate-500" style={{ fontSize: '14px', padding: '16px' }}>No incidents yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-2xl" style={{ padding: '32px' }}>
            <h3 className="font-black text-white tracking-tight" style={{ fontSize: '20px', marginBottom: '24px' }}>Recent Field Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activity.data?.data.length ? activity.data.data.map((item) => (
                <div key={item.id} className="flex items-start rounded-2xl bg-slate-900/40 border border-slate-700/30 hover:bg-slate-800/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{ padding: '20px', gap: '16px' }}>
                  <div className="shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" style={{ width: '14px', height: '14px', marginTop: '6px' }}></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-100" style={{ fontSize: '16px' }}>{item.title}</p>
                    <p className="font-medium text-slate-400" style={{ fontSize: '14px', marginTop: '4px' }}>{getRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              )) : <p className="font-medium text-slate-500" style={{ fontSize: '14px', padding: '16px' }}>No check-ins yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
