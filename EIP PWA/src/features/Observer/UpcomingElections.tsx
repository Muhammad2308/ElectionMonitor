import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight } from 'lucide-react';
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
  const electionDate = new Date(election.starts_at.replace(' ', 'T'));
  return (
    <section className="observer-next-election">
      <div className="observer-election-topline">
        <p className="observer-election-label"><CalendarDays size={12} aria-hidden="true" /> Next election</p>
        <span>{days} {days === 1 ? 'day' : 'days'} to go</span>
      </div>
      <div className="observer-election-date">
        <CalendarDays size={14} aria-hidden="true" />
        <div>
          <h2>{electionDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</h2>
          <p>{electionDate.toLocaleDateString('en', { weekday: 'long' })} · {electionDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })} WAT</p>
        </div>
      </div>
      <div className="observer-election-bottom">
        <div>
          <h3>{election.title}</h3>
          <p>{election.state_name ? `${election.state_name} election` : 'National election'}</p>
        </div>
        <button type="button" onClick={() => document.getElementById('upcoming-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          View election <ChevronRight size={13} aria-hidden="true" />
        </button>
      </div>
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
    <section aria-labelledby="upcoming-heading" className="observer-upcoming">
      <div className="observer-section-heading">
        <div><p className="observer-eyebrow">Calendar</p><h2 id="upcoming-heading">Upcoming elections</h2></div>
        <button type="button" onClick={() => document.getElementById('upcoming-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View all <ChevronRight size={12} aria-hidden="true" /></button>
      </div>

      {query.isLoading && <p className="observer-empty-state">Loading elections…</p>}
      {!query.isLoading && elections.length === 0 && (
        <p className="observer-empty-state">
          No upcoming elections are scheduled for your state yet.
        </p>
      )}

      <ol className="observer-election-list">
        {elections.map((e) => (
          <li key={e.id}>
            <div className="observer-election-day">
              <span>
                {new Date(e.starts_at.replace(' ', 'T')).toLocaleString('en', { month: 'short' })}
              </span>
              <strong>{new Date(e.starts_at.replace(' ', 'T')).getDate().toString().padStart(2, '0')}</strong>
            </div>
            <div className="observer-election-copy">
              <p>{e.title}</p>
              <span>
                {typeLabel[e.election_type] ?? e.election_type}
                {e.state_name ? ` · ${e.state_name}` : ' · National'}
              </span>
            </div>
            <span className={`observer-election-status ${e.status === 'active' ? 'is-active' : ''}`}>{e.status === 'active' ? 'Active' : e.status === 'postponed' ? 'Postponed' : 'Upcoming'}</span>
            <ChevronRight className="observer-election-arrow" size={14} aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
};
