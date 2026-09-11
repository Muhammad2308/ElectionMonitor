import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export interface Observer extends User {
  pollingUnitId: string;
  pollingUnitName: string;
  state: string;
  lga: string;
  ward: string;
  reportsCount: number;
  incidentsCount: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export const usersAPI = {
  /**
   * Get all users with pagination
   */
  getUsers: async (page: number = 1, limit: number = 20): Promise<{ data: User[]; total: number }> => {
    return apiClient.get('/api/users', { params: { page, limit } });
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    return apiClient.get(`/api/users/${id}`);
  },

  /**
   * Create a new user
   */
  createUser: async (data: Partial<User>): Promise<User> => {
    return apiClient.post('/api/users', data);
  },

  /**
   * Update user
   */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.put(`/api/users/${id}`, data);
  },

  /**
   * Delete user
   */
  deleteUser: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/users/${id}`);
  },

  /**
   * Get user permissions
   */
  getUserPermissions: async (userId: string): Promise<Permission[]> => {
    return apiClient.get(`/api/users/${userId}/permissions`);
  },
};

export const observersAPI = {
  /**
   * Get all observers with pagination and filters
   */
  getObservers: async (
    page: number = 1,
    limit: number = 20,
    filters?: { state?: string; status?: string }
  ): Promise<{ data: Observer[]; total: number }> => {
    return apiClient.get('/api/observers', { params: { page, limit, ...filters } });
  },

  /**
   * Get observer by ID
   */
  getObserverById: async (id: string): Promise<Observer> => {
    return apiClient.get(`/api/observers/${id}`);
  },

  /**
   * Get observer reports
   */
  getObserverReports: async (observerId: string): Promise<any[]> => {
    return apiClient.get(`/api/observers/${observerId}/reports`);
  },

  /**
   * Get observer incidents
   */
  getObserverIncidents: async (observerId: string): Promise<any[]> => {
    return apiClient.get(`/api/observers/${observerId}/incidents`);
  },

  /**
   * Assign observer to polling unit
   */
  assignObserver: async (observerId: string, pollingUnitId: string): Promise<Observer> => {
    return apiClient.post(`/api/observers/${observerId}/assign`, { pollingUnitId });
  },

  /**
   * Get observer location (real-time tracking)
   */
  getObserverLocation: async (observerId: string): Promise<{ lat: number; lng: number; timestamp: string }> => {
    return apiClient.get(`/api/observers/${observerId}/location`);
  },
};

export const rolesAPI = {
  /**
   * Get all roles
   */
  getRoles: async (): Promise<Role[]> => {
    return apiClient.get('/api/roles');
  },

  /**
   * Get role by ID
   */
  getRoleById: async (id: string): Promise<Role> => {
    return apiClient.get(`/api/roles/${id}`);
  },

  /**
   * Create new role
   */
  createRole: async (data: Partial<Role>): Promise<Role> => {
    return apiClient.post('/api/roles', data);
  },

  /**
   * Update role
   */
  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    return apiClient.put(`/api/roles/${id}`, data);
  },

  /**
   * Delete role
   */
  deleteRole: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/roles/${id}`);
  },

  /**
   * Get role permissions
   */
  getRolePermissions: async (roleId: string): Promise<Permission[]> => {
    return apiClient.get(`/api/roles/${roleId}/permissions`);
  },

  /**
   * Assign permission to role
   */
  assignPermission: async (roleId: string, permissionId: string): Promise<Role> => {
    return apiClient.post(`/api/roles/${roleId}/permissions`, { permissionId });
  },
};

export const permissionsAPI = {
  /**
   * Get all permissions
   */
  getPermissions: async (): Promise<Permission[]> => {
    return apiClient.get('/api/permissions');
  },

  /**
   * Get permission by ID
   */
  getPermissionById: async (id: string): Promise<Permission> => {
    return apiClient.get(`/api/permissions/${id}`);
  },

  /**
   * Get permissions by resource
   */
  getPermissionsByResource: async (resource: string): Promise<Permission[]> => {
    return apiClient.get(`/api/permissions`, { params: { resource } });
  },
};
