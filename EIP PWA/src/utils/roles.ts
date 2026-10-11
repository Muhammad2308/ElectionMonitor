export const ADMIN_ROLES = [
  'state_admin',
  'state_master_admin',
  'national_master_admin',
  'cybernet_superadmin',
  'admin',
  'superadmin',
];

export const isAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const normalized = String(role).toLowerCase().trim();
  return ADMIN_ROLES.includes(normalized);
};

export const homeRouteForRole = (role?: string | null): string =>
  isAdminRole(role) ? '/admin/dashboard' : '/dashboard';
