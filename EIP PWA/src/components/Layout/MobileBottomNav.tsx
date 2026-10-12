import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from './navItems';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const active = location.pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150 ${
              active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.shortLabel}</span>
            {item.badge && (
              <span
                aria-hidden="true"
                className="absolute right-1/2 top-1.5 h-1.5 w-1.5 translate-x-3.5 rounded-full bg-green-500"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
