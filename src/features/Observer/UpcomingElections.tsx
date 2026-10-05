import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin } from 'lucide-react';
import { formatDateTime } from '../../utils/formatting';
import { observerAPI, type UpcomingElection } from './api';

const daysUntil = (iso: string) => {
  const ms = new Date(iso.replace(' ', 'T')).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
};

const typeLabel: Record<string, string> = {
  presidential: 'Presidential',
  governorship: 'Governorship',
  senate: 'Senate',
  house_of_reps: 'House of Reps',
  state_assembly: 'State Assembly',
  chairmanship: 'LGA Chairmanship',
  councillor: 'Councillorship',
};

export const NextElectionCard: React.FC<{ election: UpcomingElection }> = ({ election }) => {
  const days = daysUntil(election.starts_at);
  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-5 shadow-lg shadow-blue-950/40">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200">Next election</p>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-5xl font-black leading-none text-white tabular-nums">{days}</span>
        <span className="pb-1 text-sm font-semibold text-sky-100">{days === 1 ? 'day' : 'days'} to go</span>
      </div>
      <h3 className="mt-3 text-base font-bold text-white">{election.title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-sky-100">
        <CalendarDays size={14} aria-hidden="true" /> {formatDateTime(election.starts_at)}
        {election.state_name && (
          <>
            <span aria-hidden="true">·</span>
            <MapPin size={14} aria-hidden="true" /> {election.state_name}
          </>
        )}
      </p>
    </section>
  );
};

export const UpcomingElections: React.FC = () => {
  const query = useQuery({
    queryKey: ['observer', 'elections'],
    queryFn: () => observerAPI.upcomingElections(),
    staleTime: 5 * 60_000,
  });

  const elections = query.data?.data ?? [];

  return (
    <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="upcoming-heading" className="text-sm font-bold uppercase tracking-wider text-slate-400">Upcoming elections</h2>
        <span className="text-xs text-slate-500">{elections.length} scheduled</span>
      </div>

      {query.isLoading && <p className="text-sm text-slate-400">Loading elections…</p>}
      {!query.isLoading && elections.length === 0 && (
        <p className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 text-sm text-slate-400">
          No upcoming elections are scheduled for your state yet.
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {elections.map((e) => (
          <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
            <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-blue-600/15 py-1.5 text-center">
              <span className="text-[10px] font-bold uppercase text-sky-300">
                {new Date(e.starts_at.replace(' ', 'T')).toLocaleString('en', { month: 'short' })}
              </span>
              <span className="text-lg font-black text-white">{new Date(e.starts_at.replace(' ', 'T')).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{e.title}</p>
              <p className="text-xs text-slate-400">
                {typeLabel[e.election_type] ?? e.election_type}
                {e.state_name ? ` · ${e.state_name}` : ' · National'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-700/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {daysUntil(e.starts_at)}d
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};
