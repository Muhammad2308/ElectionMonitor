import api from '../../api';

export interface DashboardMetrics {
    total_incidents: number;
    incidents_last_hour: number;
    active_observers: number;
    deployed_observers: number;
    open_incidents: number;
    critical_incidents: number;
    polling_units: number;
    covered_polling_units: number;
    coverage_percentage: number;
}

export interface ActivityItem {
    id: string | number;
    title: string;
    severity?: string;
    status: string;
    created_at: string;
}

export interface ActivityChartPoint {
    hour: string;
    incidents: number;
    checkins: number;
}

export const dashboardAPI = {
    getMetrics: (): Promise<DashboardMetrics> => api.get('/dashboard/metrics'),
    getIncidents: (limit = 6): Promise<{ data: ActivityItem[] }> => api.get('/dashboard/incidents', { params: { limit } }),
    getActivity: (limit = 6): Promise<{ data: ActivityItem[] }> => api.get('/dashboard/activity', { params: { limit } }),
    getActivityChart: (): Promise<{ data: ActivityChartPoint[] }> => api.get('/dashboard/activity-chart'),
};

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    state_id: number | null;
    state_name: string | null;
    lga_id?: number | null;
    lga_name?: string | null;
    status: 'active' | 'inactive' | 'suspended';
    role: string | null;
    roles: string[];
    incidents_count?: number;
    assignments_count?: number;
    check_ins_count?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta?: { current_page: number; last_page: number; total: number };
    links?: unknown;
    current_page?: number;
    last_page?: number;
    total?: number;
}

export const usersAPI = {
    list: (params: { page?: number; role?: string; status?: string; search?: string; state_id?: number } = {}): Promise<PaginatedResponse<AdminUser>> =>
        api.get('/users', { params }),
    create: (data: { name: string; email: string; phone?: string; password: string; state_id?: number; lga_id?: number; role: string }) =>
        api.post('/users', data),
    suspend: (id: number) => api.post(`/users/${id}/suspend`),
    assignRole: (id: number, role: string) => api.post(`/users/${id}/assign-role`, { role }),
    lgaAssignments: (id: number): Promise<{ data: LgaAssignment[] }> => api.get(`/users/${id}/lga-assignments`),
    assignLga: (id: number, lga_id: number) => api.post(`/users/${id}/lga-assignments`, { lga_id }),
    removeLga: (id: number, lga_id: number) => api.delete(`/users/${id}/lga-assignments/${lga_id}`),
};

export interface LgaAssignment {
    id: number;
    lga_id: number;
    lga?: { id: number; name: string; state_id: number };
    is_active: boolean;
}

export const observerAssignmentsAPI = {
    create: (data: { user_id: number; polling_unit_id: number; election_date: string }) => api.post('/assignments', data),
};

export interface Role {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
    created_at: string;
}

export interface Permission {
    id: number;
    name: string;
    resource: string;
    action: string;
}

export const rolesAPI = {
    list: (): Promise<{ data: Role[] }> => api.get('/roles'),
    update: (id: number, data: { permissions: string[] }) => api.put(`/roles/${id}`, data),
};

export const permissionsAPI = {
    list: (): Promise<{ data: Permission[] }> => api.get('/permissions'),
};

export interface AdminIncident {
    id: string;
    category_name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'dismissed';
    description: string | null;
    involving_party?: string;
    incident_time: string;
    polling_unit?: { id: number; name: string; ward?: string; lga?: string; state?: string };
    reporter?: { id: number; name: string };
}

export const incidentsAPI = {
    list: (params: { severity?: string; status?: string; search?: string; limit?: number } = {}): Promise<PaginatedResponse<AdminIncident>> =>
        api.get('/incidents', { params }),
};

export interface MapPollingUnit {
    id: number;
    pu_code: string;
    name: string;
    latitude: number;
    longitude: number;
    ward: string | null;
    lga: string | null;
    state: string | null;
    open_incidents: number;
    has_coverage: boolean;
}

export interface MapObserver {
    id: number;
    name: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    last_seen_at: string | null;
    polling_unit: string | null;
    is_online: boolean;
}

export interface MapIncident {
    id: string;
    latitude: number;
    longitude: number;
    severity: string;
    status: string;
    category: string;
    polling_unit: string;
    reported_at: string;
}

export const gisAPI = {
    pollingUnits: (): Promise<{ data: MapPollingUnit[] }> => api.get('/gis/polling-units'),
    observers: (): Promise<{ data: MapObserver[] }> => api.get('/gis/observers'),
    incidents: (): Promise<{ data: MapIncident[] }> => api.get('/gis/incidents'),
};
