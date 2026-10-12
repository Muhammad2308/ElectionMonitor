import { LayoutDashboard, AlertTriangle, Users, ShieldCheck, Map, MapPinned } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, href: '/admin/dashboard' },
  { id: 'incidents', label: 'Incidents', shortLabel: 'Incidents', icon: AlertTriangle, href: '/admin/incidents' },
  { id: 'users', label: 'Observers & Users', shortLabel: 'Users', icon: Users, href: '/admin/users' },
  { id: 'roles', label: 'Roles & Permissions', shortLabel: 'Roles', icon: ShieldCheck, href: '/admin/roles' },
  { id: 'map', label: 'Live Map', shortLabel: 'Map', icon: Map, href: '/admin/map', badge: 'LIVE' },
  { id: 'polling-units', label: 'Polling Units', shortLabel: 'PUs', icon: MapPinned, href: '/admin/polling-units' },
];
