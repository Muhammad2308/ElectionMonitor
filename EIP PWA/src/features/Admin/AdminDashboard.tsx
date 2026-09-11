import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
        <div className="flex items-center justify-center h-96 text-gray-400">Loading dashboard…</div>
      </AdminLayout>
    );
  }

  if (metrics.isError) {
    return (
      <AdminLayout>
        <div className="bg-red-950 border border-red-700 border-opacity-30 rounded-lg p-6">
          <p className="text-red-400">Failed to load dashboard metrics. Is the API reachable?</p>
        </div>
      </AdminLayout>
    );
  }

  const m = metrics.data!;

  const metricCards = [
    {
      icon: '📋',
      value: m.total_incidents,
      label: 'Total Incidents',
      subtitle: `+${m.incidents_last_hour} this hour`,
      variant: 'default' as const,
    },
    {
      icon: '👁',
      value: m.active_observers,
      label: 'Active Observers',
      subtitle: `of ${m.deployed_observers} deployed`,
      variant: 'success' as const,
    },
    {
      icon: '⚠',
      value: m.open_incidents,
      label: 'Open Incidents',
      subtitle: `${m.critical_incidents} critical`,
      variant: 'warning' as const,
    },
    {
      icon: '🏛',
      value: m.polling_units.toLocaleString(),
      label: 'Polling Units',
      subtitle: `${m.coverage_percentage}% covered`,
      variant: 'info' as const,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <MetricsGrid metrics={metricCards} />

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Incident &amp; Check-in Activity</h3>
            <p className="text-gray-400 text-sm">Today, hourly breakdown</p>
          </div>

          <div className="h-64">
            {chart.data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data.data}>
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
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} interval={2} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="incidents" stroke="#ef4444" fill="url(#incidentsGrad)" name="Incidents" />
                  <Area type="monotone" dataKey="checkins" stroke="#3b82f6" fill="url(#checkinsGrad)" name="Check-ins" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Incidents</h3>
            <div className="space-y-3">
              {incidents.data?.data.length ? incidents.data.data.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${severityDot[item.severity || 'low']}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{getRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              )) : <p className="text-gray-500 text-sm">No incidents yet.</p>}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Field Activity</h3>
            <div className="space-y-3">
              {activity.data?.data.length ? activity.data.data.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{getRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              )) : <p className="text-gray-500 text-sm">No check-ins yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
