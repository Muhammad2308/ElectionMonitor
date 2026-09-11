import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { MetricsGrid } from '../components/Dashboard/MetricCard';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard: React.FC = () => {
  const { data, loading, error } = useDashboardData();

  const metrics = [
    {
      icon: '📋',
      value: data?.totalReports || 312,
      label: 'Total Reports',
      subtitle: '+23 this hour',
      variant: 'default' as const,
      trend: { value: 23, direction: 'up' as const },
    },
    {
      icon: '👁',
      value: data?.activeObservers || 213,
      label: 'Active Observers',
      subtitle: 'of 274 deployed',
      variant: 'success' as const,
    },
    {
      icon: '⚠',
      value: data?.openIncidents || 41,
      label: 'Open Incidents',
      subtitle: '8 critical',
      variant: 'warning' as const,
    },
    {
      icon: '🏛',
      value: data?.pollingUnits || 847,
      label: 'Polling Units',
      subtitle: '94.2% covered',
      variant: 'info' as const,
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-950 border border-red-700 border-opacity-30 rounded-lg p-6">
          <p className="text-red-400">Error loading dashboard: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Metrics Grid */}
        <MetricsGrid metrics={metrics} />

        {/* Activity Chart Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Incident & Report Activity</h3>
            <p className="text-gray-400 text-sm">Today, hourly breakdown</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mb-6 border-b border-gray-700">
            <button className="pb-4 font-medium text-white border-b-2 border-blue-600">
              Incidents
            </button>
            <button className="pb-4 text-gray-400 hover:text-white transition-colors">
              Reports
            </button>
          </div>

          {/* Chart Placeholder */}
          <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Chart placeholder
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents List */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Incidents</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      Incident {i}: Ballot irregularity reported
                    </p>
                    <p className="text-gray-500 text-xs mt-1">5 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Latest Reports</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      Report {i}: Polling smooth and orderly
                    </p>
                    <p className="text-gray-500 text-xs mt-1">12 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
