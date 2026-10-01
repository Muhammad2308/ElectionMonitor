export const ADMIN_ROLES = ['state_admin', 'state_master_admin', 'national_master_admin', 'cybernet_superadmin'];

export const isAdminRole = (role?: string | null): boolean => !!role && ADMIN_ROLES.includes(role);

export const homeRouteForRole = (role?: string | null): string => (isAdminRole(role) ? '/admin/dashboard' : '/dashboard');
