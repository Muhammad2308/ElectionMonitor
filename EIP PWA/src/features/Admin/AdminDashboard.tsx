import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList, Eye, AlertTriangle, Building2 } from 'lucide-react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { MetricsGrid } from '../../components/Dashboard/MetricCard';
import { dashboardAPI } from './api';
import { getRelativeTime } from '../../utils/formatting';

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-500',
};

export const AdminDashboard: React.FC = () => {
  const metrics = useQuery({ queryKey: ['dashboard', 'metrics'], queryFn: dashboardAPI.getMetrics, refetchInterval: 30_000 });
  const incidents = useQuery({ queryKey: ['dashboard', 'incidents'], queryFn: () => dashboardAPI.getIncidents(6), refetchInterval: 30_000 });
  const activity = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: () => dashboardAPI.getActivity(6), refetchInterval: 30_000 });
  const chart = useQuery({ queryKey: ['dashboard', 'activity-chart'], queryFn: dashboardAPI.getActivityChart, refetchInterval: 60_000 });

  if (metrics.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center text-gray-400 sm:h-96">Loading dashboard…</div>
      </AdminLayout>
    );
  }

  if (metrics.isError) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-red-700 border-opacity-30 bg-red-950 p-4 sm:p-6">
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
      <div className="space-y-6 sm:space-y-8">
        {/* Compact page title — desktop shows the full Header instead */}
        <div className="lg:hidden">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-gray-400">Live monitoring overview</p>
        </div>

        <MetricsGrid metrics={metricCards} />

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg font-bold text-white sm:text-xl">Incident &amp; Check-in Activity</h3>
            <p className="text-xs text-gray-400 sm:text-sm">Today, hourly breakdown</p>
          </div>

          <div className="h-48 sm:h-64">
            {chart.data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data.data} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="checkinsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} interval={3} tickMargin={8} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} width={28} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="incidents" stroke="#ef4444" fill="url(#incidentsGrad)" name="Incidents" />
                  <Area type="monotone" dataKey="checkins" stroke="#3b82f6" fill="url(#checkinsGrad)" name="Check-ins" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
            <h3 className="mb-3 text-base font-bold text-white sm:mb-4 sm:text-lg">Recent Incidents</h3>
            <div className="space-y-2 sm:space-y-3">
              {incidents.data?.data.length ? incidents.data.data.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg bg-gray-900 p-2.5 sm:p-3">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3 ${severityDot[item.severity || 'low']}`}></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{getRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">No incidents yet.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
            <h3 className="mb-3 text-base font-bold text-white sm:mb-4 sm:text-lg">Recent Field Activity</h3>
            <div className="space-y-2 sm:space-y-3">
              {activity.data?.data.length ? activity.data.data.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg bg-gray-900 p-2.5 sm:p-3">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 sm:h-3 sm:w-3"></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{getRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">No check-ins yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
