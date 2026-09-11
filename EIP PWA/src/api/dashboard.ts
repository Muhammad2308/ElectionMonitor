import { apiClient } from './client';

interface MetricsResponse {
  totalReports: number;
  activeObservers: number;
  openIncidents: number;
  criticalIncidents: number;
  pollingUnits: number;
  coveragePercentage: number;
  status: string;
}

interface IncidentResponse {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface ReportResponse {
  id: string;
  title: string;
  pollingUnitId: string;
  location: string;
  observerId: string;
  observerName: string;
  content: string;
  timestamp: string;
  status: 'submitted' | 'reviewed' | 'processed';
}

interface ActivityChartData {
  hour: string;
  incidents: number;
  reports: number;
}

export const dashboardAPI = {
  /**
   * Get dashboard metrics
   * @returns Dashboard metrics data
   */
  getMetrics: async (): Promise<MetricsResponse> => {
    return apiClient.get('/api/dashboard/metrics');
  },

  /**
   * Get incidents for today
   * @returns List of incidents
   */
  getIncidents: async (limit: number = 10): Promise<IncidentResponse[]> => {
    return apiClient.get('/api/dashboard/incidents', { limit });
  },

  /**
   * Get reports for today
   * @returns List of reports
   */
  getReports: async (limit: number = 10): Promise<ReportResponse[]> => {
    return apiClient.get('/api/dashboard/reports', { limit });
  },

  /**
   * Get hourly activity data for charts
   * @returns Hourly breakdown of incidents and reports
   */
  getActivityChart: async (): Promise<ActivityChartData[]> => {
    return apiClient.get('/api/dashboard/activity-chart');
  },

  /**
   * Get real-time dashboard status
   * @returns Current system status
   */
  getStatus: async (): Promise<{ status: string; pollingOpen: boolean; timeRemaining: number }> => {
    return apiClient.get('/api/dashboard/status');
  },

  /**
   * Subscribe to real-time updates
   * @param onUpdate Callback for updates
   * @returns Unsubscribe function
   */
  subscribeToUpdates: (onUpdate: (data: any) => void) => {
    // Implementation for WebSocket or Server-Sent Events
    return () => {
      // Cleanup function
    };
  },
};
