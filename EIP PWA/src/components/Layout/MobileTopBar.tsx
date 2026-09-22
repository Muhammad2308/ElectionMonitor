import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ThemeToggle } from '../UI/ThemeToggle';

const MobileTopBar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur-sm lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          E
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-white">ElectWatch</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">
            {user?.role ?? 'Admin'}
          </p>
        </div>
      </div>
      <ThemeToggle />
      <button
        onClick={() => { logout(); navigate('/login'); }}
        aria-label="Log out"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-gray-800 hover:text-white"
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </header>
  );
};

export default MobileTopBar;
