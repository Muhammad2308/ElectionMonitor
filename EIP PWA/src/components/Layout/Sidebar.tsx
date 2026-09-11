import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞', href: '/admin/dashboard' },
  { id: 'incidents', label: 'Incidents', icon: '⚠', href: '/admin/incidents' },
  { id: 'users', label: 'Observers & Users', icon: '👥', href: '/admin/users' },
  { id: 'roles', label: 'Roles & Permissions', icon: '🔐', href: '/admin/roles' },
  { id: 'map', label: 'Live Map', icon: '🗺', href: '/admin/map', badge: 'LIVE' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="w-72 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold">ElectWatch</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              to={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                active ? 'bg-blue-600/20 text-white border border-blue-600/40' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-green-600 text-green-100">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs truncate">{user?.role}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Log out"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
