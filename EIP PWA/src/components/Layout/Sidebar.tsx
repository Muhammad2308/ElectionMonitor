import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  submenu?: MenuItem[];
  badge?: string | number;
}

const Sidebar: React.FC = () => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>('user-mgmt');

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '⊞',
      href: '/dashboard',
    },
    {
      id: 'user-mgmt',
      label: 'User Mgmt',
      icon: '👥',
      href: '#',
      submenu: [
        { id: 'observers', label: 'Observers', icon: '👁', href: '/observers' },
        { id: 'roles', label: 'Roles', icon: '🏷', href: '/roles' },
        { id: 'permissions', label: 'Permissions', icon: '🔐', href: '/permissions' },
      ],
    },
    {
      id: 'map-view',
      label: 'Map View LIVE',
      icon: '🗺',
      href: '/map',
      badge: 'LIVE',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '💬',
      href: '/messages',
      badge: 4,
    },
  ];

  return (
    <aside className="w-96 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
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

      {/* Status Box */}
      <div className="px-6 py-4">
        <div className="border border-green-500 border-opacity-30 rounded-lg p-4 bg-green-950 bg-opacity-20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-semibold uppercase tracking-wide">Polls Open</span>
          </div>
          <p className="text-gray-300 text-sm">Closes in 3h 42m</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => item.submenu && setExpandedMenu(expandedMenu === item.id ? null : item.id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-white font-medium">{item.label}</span>
                {item.submenu && (
                  <span className={`text-gray-400 ml-auto transition-transform ${expandedMenu === item.id ? 'rotate-90' : ''}`}>
                    ›
                  </span>
                )}
              </div>
              {item.badge && (
                <span className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${
                  typeof item.badge === 'string'
                    ? 'bg-green-600 text-green-100'
                    : 'bg-red-600 text-red-100'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>

            {/* Submenu */}
            {item.submenu && expandedMenu === item.id && (
              <div className="ml-8 space-y-1">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.id}
                    to={subitem.href}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
                  >
                    <span>{subitem.icon}</span>
                    <span>{subitem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">System Admin</p>
            <p className="text-gray-400 text-xs truncate">admin@electwatch.ng</p>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            ⚙
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
