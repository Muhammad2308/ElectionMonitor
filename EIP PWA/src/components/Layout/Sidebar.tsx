import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { navItems } from './navItems';

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
    <aside className="hidden w-72 flex-col overflow-hidden border-r border-gray-800 bg-gray-950 lg:flex">
      {/* Logo Section */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-2xl font-bold">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold">ElectWatch</h1>
            <p className="text-xs uppercase tracking-wider text-gray-400">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-colors duration-150 ${
                active ? 'border border-blue-600/40 bg-blue-600/20 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-green-100">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{user?.role}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Log out"
            aria-label="Log out"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-gray-800 hover:text-white"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
