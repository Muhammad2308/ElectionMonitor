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
    <aside className="hidden flex-col overflow-hidden border-r border-slate-800/50 bg-slate-950/40 backdrop-blur-xl lg:flex relative z-20 shadow-2xl" style={{ width: '300px' }}>
      {/* Logo Section */}
      <div className="border-b border-slate-800/50" style={{ padding: '32px 24px' }}>
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-black text-white shadow-lg shadow-blue-500/30" style={{ width: '48px', height: '48px' }}>
            E
          </div>
          <div>
            <h1 className="font-black tracking-tight text-white" style={{ fontSize: '24px', lineHeight: '1.2' }}>ElectWatch</h1>
            <p className="font-bold uppercase tracking-widest text-indigo-400" style={{ fontSize: '11px', marginTop: '4px' }}>Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto" style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex cursor-pointer items-center justify-between rounded-xl transition-all duration-200 ${
                active 
                  ? 'border border-blue-500/30 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)]' 
                  : 'border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
              style={{ padding: '16px 20px' }}
            >
              <div className="flex items-center" style={{ gap: '16px' }}>
                <Icon size={22} className={active ? 'text-blue-400' : ''} aria-hidden="true" />
                <span className="font-semibold" style={{ fontSize: '15px' }}>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-md bg-emerald-500/20 font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20" style={{ padding: '4px 8px', fontSize: '10px' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-slate-800/50 bg-slate-900/30" style={{ padding: '24px' }}>
        <div className="flex items-center" style={{ gap: '16px' }}>
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg" style={{ width: '44px', height: '44px', fontSize: '16px' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white" style={{ fontSize: '15px' }}>{user?.name}</p>
            <p className="truncate font-medium text-slate-400 capitalize" style={{ fontSize: '12px', marginTop: '4px' }}>{user?.role}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Log out"
            aria-label="Log out"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
            style={{ width: '40px', height: '40px' }}
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
