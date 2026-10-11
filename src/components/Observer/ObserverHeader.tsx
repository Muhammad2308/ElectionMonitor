import React from 'react';
import { ArrowLeft, CloudOff, Radio } from 'lucide-react';
import { ThemeToggle } from '../UI/ThemeToggle';

interface ObserverHeaderProps {
  /** Context shown under the app name, e.g. "PRESENCE VERIFICATION". */
  subtitle: string;
  onBack?: () => void;
  backLabel?: string;
  /** Pass to show the connection status. Omit on screens where it doesn't apply. */
  isOnline?: boolean;
  onSignOut: () => void;
  userInitial?: string;
}

/**
 * Mobile-first field header. Every control is a 44px touch target, the brand
 * shrinks instead of pushing controls off-screen, and the connection status is
 * icon-only below 640px (the icon and the text are both present for screen readers).
 */
export const ObserverHeader: React.FC<ObserverHeaderProps> = ({
  subtitle,
  onBack,
  backLabel = 'Back',
  isOnline,
  onSignOut,
  userInitial = 'O',
}) => (
  <header className="observer-mobile-header sticky top-0 z-40 border-b border-[#1d3d5e] bg-[#071b33] text-white">
    <div className="mx-auto flex h-14 w-full max-w-5xl min-w-0 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sky-50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 text-lg font-black"
        >
          E
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight">ElectWatch</p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200">{subtitle}</p>
        </div>
      </div>

      {isOnline !== undefined && (
        <span
          role="status"
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold ${
            isOnline ? 'bg-emerald-950 text-emerald-200' : 'bg-amber-950 text-amber-200'
          }`}
        >
          {isOnline ? <Radio size={14} aria-hidden="true" /> : <CloudOff size={14} aria-hidden="true" />}
          <span className="sr-only sm:not-sr-only">{isOnline ? 'Online' : 'Offline'}</span>
        </span>
      )}

      <ThemeToggle compact />

      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#31516f] bg-[#102a46] text-sm font-extrabold text-sky-50 hover:bg-[#163a60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        <span aria-hidden="true">{userInitial.slice(0, 1).toUpperCase()}</span>
      </button>
    </div>
  </header>
);
