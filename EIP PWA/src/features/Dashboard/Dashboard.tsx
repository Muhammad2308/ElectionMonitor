import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LocateFixed,
  MapPin,
  RefreshCw,
  Upload,
  UserPlus,
} from 'lucide-react';
import { db } from '../../storage/db';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useMyAssignment } from '../Assignments/useMyAssignment';
import { ObserverHeader } from '../../components/Observer/ObserverHeader';
import { observerAPI } from '../Observer/api';
import { NextElectionCard, UpcomingElections } from '../Observer/UpcomingElections';
import { InboxPanel } from '../Observer/InboxPanel';

interface ActionProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  tone: string;
  badge?: number;
}

const QuickAction: React.FC<ActionProps> = ({ icon, title, hint, onClick, disabled, tone, badge }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative flex min-h-[112px] flex-col items-start justify-between gap-3 rounded-2xl p-4 text-left text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none ${tone}`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">{icon}</span>
    <span>
      <span className="block text-sm font-bold leading-tight">{title}</span>
      <span className="mt-1 block text-[11px] leading-snug text-white/80">{hint}</span>
    </span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-blue-700">{badge}</span>
    )}
  </button>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isOnline, pendingCount, failedCount, lastSyncTime, isSyncing } = useSyncStore();
  const { assignment, isLoading, isOfflineCopy, refresh } = useMyAssignment();
  const [stats, setStats] = useState({ filed: 0, synced: 0 });

  useEffect(() => {
    const load = async () => setStats({
      filed: await db.incidents.count(),
      synced: await db.incidents.where('sync_status').equals('synced').count(),
    });
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const elections = useQuery({
    queryKey: ['observer', 'elections'],
    queryFn: () => observerAPI.upcomingElections(),
    staleTime: 5 * 60_000,
  });
  const inbox = useQuery({
    queryKey: ['observer', 'inbox'],
    queryFn: () => observerAPI.inbox(),
    refetchInterval: 60_000,
  });

  const pollingUnit = assignment?.polling_unit;
  const hasCoordinate = pollingUnit?.latitude != null && pollingUnit?.longitude != null;
  const nextElection = elections.data?.data?.[0];
  const firstName = user?.name?.split(' ')[0] ?? 'Observer';
  const signOut = () => { logout(); navigate('/login'); };

  const scrollToInbox = () => document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-slate-900 pb-24 text-slate-100">
      <ObserverHeader subtitle="FIELD OPERATIONS" isOnline={isOnline} onSignOut={signOut} userInitial={user?.name} />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 pb-10 pt-6 sm:px-6">
        <section className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-300">Observer console</p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">Good day, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-400">Your reports and check-ins sync when you're back online.</p>
          </div>
          <button
            onClick={() => void refresh()}
            disabled={isLoading}
            aria-label="Refresh assignment"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </section>

        {nextElection ? (
          <NextElectionCard election={nextElection} />
        ) : (
          !elections.isLoading && (
            <p className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 text-sm text-slate-400">
              No upcoming election is scheduled yet.
            </p>
          )
        )}

        <section aria-labelledby="assignment-heading" className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="assignment-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <MapPin size={16} aria-hidden="true" /> Your polling unit
            </h2>
            {isOfflineCopy && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">Offline copy</span>}
          </div>

          {isLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-700/40" />
          ) : pollingUnit ? (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <p className="text-xl font-bold leading-snug">{pollingUnit.name}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{pollingUnit.pu_code}</p>
              </div>
              <div className={`flex items-start gap-3 rounded-xl p-3 ${hasCoordinate ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                {hasCoordinate ? <CheckCircle2 className="mt-0.5 text-emerald-400" size={20} aria-hidden="true" /> : <LocateFixed className="mt-0.5 text-amber-400" size={20} aria-hidden="true" />}
                <div>
                  <p className={`text-sm font-bold ${hasCoordinate ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {hasCoordinate ? 'Location verified' : 'Location not yet verified'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    {hasCoordinate ? 'Approved coordinates are on file for this polling unit.' : 'Capture the GPS location and photos so the admin can approve it.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {!hasCoordinate && (
                  <button
                    onClick={() => navigate(`/register-polling-unit?pu=${pollingUnit.id}`)}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-slate-900 hover:bg-amber-400"
                  >
                    <LocateFixed size={18} aria-hidden="true" /> Verify location
                  </button>
                )}
                <button
                  onClick={() => navigate('/checkin')}
                  disabled={!hasCoordinate}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Check in at polling unit <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              You haven't been assigned to a polling unit yet. Your admin will notify you in your inbox when you are.
            </p>
          )}
        </section>

        <section aria-labelledby="actions-heading" className="flex flex-col gap-3">
          <h2 id="actions-heading" className="text-sm font-bold uppercase tracking-wider text-slate-400">Field actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={<AlertTriangle size={20} aria-hidden="true" />}
              title="Report incident"
              hint={pollingUnit ? 'Details, GPS and evidence' : 'Needs an assignment'}
              onClick={() => navigate('/report')}
              disabled={!pollingUnit}
              tone="bg-gradient-to-br from-rose-600 to-red-800"
            />
            <QuickAction
              icon={<LocateFixed size={20} aria-hidden="true" />}
              title="Check in"
              hint={hasCoordinate ? 'Confirm you are on site' : 'After location approval'}
              onClick={() => navigate('/checkin')}
              disabled={!hasCoordinate}
              tone="bg-gradient-to-br from-emerald-600 to-teal-800"
            />
            <QuickAction
              icon={<UserPlus size={20} aria-hidden="true" />}
              title="Register polling unit"
              hint="Add or verify a unit's location"
              onClick={() => navigate('/register-polling-unit')}
              tone="bg-gradient-to-br from-blue-600 to-indigo-800"
            />
            <QuickAction
              icon={<ClipboardList size={20} aria-hidden="true" />}
              title="Inbox"
              hint="Assignments and updates"
              onClick={scrollToInbox}
              tone="bg-gradient-to-br from-violet-600 to-purple-800"
              badge={inbox.data?.unread_count}
            />
          </div>
        </section>

        <UpcomingElections />

        <InboxPanel />

        <section aria-labelledby="sync-heading" className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="sync-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Upload size={16} aria-hidden="true" /> Sync
            </h2>
            <span className="rounded-full bg-slate-700/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {isSyncing ? 'Syncing…' : isOnline ? 'Ready' : 'Waiting for network'}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div><dt className="text-[11px] uppercase text-slate-500">Queued</dt><dd className="text-2xl font-black">{pendingCount}</dd></div>
            <div><dt className="text-[11px] uppercase text-slate-500">Synced</dt><dd className="text-2xl font-black">{stats.synced}</dd></div>
            <div><dt className="text-[11px] uppercase text-slate-500">Attention</dt><dd className={`text-2xl font-black ${failedCount > 0 ? 'text-rose-400' : ''}`}>{failedCount}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            {lastSyncTime
              ? `Last completed sync: ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Reports stay safely on this device until they sync.'}
          </p>
        </section>
      </main>
    </div>
  );
};
