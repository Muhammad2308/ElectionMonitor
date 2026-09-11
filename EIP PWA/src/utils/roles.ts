export const ADMIN_ROLES = ['ward-supervisor', 'lga-supervisor', 'state-coordinator', 'national-admin', 'super-admin'];

export const isAdminRole = (role?: string | null): boolean => !!role && ADMIN_ROLES.includes(role);

export const homeRouteForRole = (role?: string | null): string => (isAdminRole(role) ? '/admin/dashboard' : '/dashboard');
