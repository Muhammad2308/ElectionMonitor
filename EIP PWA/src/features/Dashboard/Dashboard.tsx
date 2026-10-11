import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Home,
  LocateFixed,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
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
import './observer-dashboard.css';

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
    className={`observer-quick-action ${tone}`}
  >
    <span className="observer-quick-icon">{icon}</span>
    <span className="observer-quick-copy">
      <span className="observer-quick-title">{title}</span>
      <span className="observer-quick-hint">{hint}</span>
    </span>
    <ChevronRight className="observer-quick-chevron" size={15} aria-hidden="true" />
    {badge !== undefined && badge > 0 && (
      <span className="observer-quick-badge">{badge}</span>
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
  const scrollToElections = () => document.getElementById('upcoming-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const navItems = [
    { label: 'Overview', icon: Home, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }), active: true },
    { label: 'My polling unit', icon: MapPin, action: () => navigate('/assignment') },
    { label: 'Field reports', icon: ClipboardList, action: () => navigate('/report') },
    { label: 'Inbox', icon: MessageSquare, action: scrollToInbox, badge: inbox.data?.unread_count },
    { label: 'Elections', icon: CalendarDays, action: scrollToElections },
  ];

  return (
    <div className="observer-dashboard">
      <aside className="observer-sidebar">
        <div className="observer-brand">
          <span className="observer-brand-mark"><ShieldCheck size={17} aria-hidden="true" /></span>
          <span><strong>ElectWatch</strong><small>FIELD OPERATIONS</small></span>
        </div>
        <p className="observer-nav-label">Observer workspace</p>
        <nav className="observer-nav" aria-label="Observer workspace">
          {navItems.map(({ label, icon: Icon, action, active, badge }) => (
            <button key={label} type="button" onClick={action} className={active ? 'is-active' : ''}>
              <Icon size={14} aria-hidden="true" />
              <span>{label}</span>
              {badge ? <span className="observer-nav-badge">{badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="observer-secure">
          <ShieldCheck size={15} aria-hidden="true" />
          <span><strong>Secure session</strong><small>Encrypted & protected</small></span>
        </div>
      </aside>

      <div className="observer-workspace">
        <ObserverHeader subtitle="FIELD OPERATIONS" isOnline={isOnline} onSignOut={signOut} userInitial={user?.name} />
        <header className="observer-topbar">
          <div className="observer-breadcrumb">Field operations <ChevronRight size={12} aria-hidden="true" /> <strong>Overview</strong></div>
          <div className="observer-topbar-tools">
            <span className={`observer-connection ${isOnline ? 'is-online' : ''}`}><i />{isOnline ? 'Online mode' : 'Offline mode'}</span>
            <button type="button" onClick={() => void refresh()} disabled={isLoading} aria-label="Refresh assignment" title="Refresh assignment"><RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" /></button>
            <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out">{(user?.name?.[0] ?? 'O').toUpperCase()}</button>
          </div>
        </header>

        <main className="observer-main">
          <div className="observer-content">
            <section className="observer-greeting">
              <div>
                <p className="observer-eyebrow">Observer console</p>
                <h1>Good day, {firstName}.</h1>
                <p>Your field workspace is ready. Reports and check-ins will sync automatically when you're back online.</p>
              </div>
              <span className="observer-last-sync"><RefreshCw size={11} aria-hidden="true" /> {lastSyncTime ? `Last synced ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for first sync'}</span>
            </section>

            <section className="observer-hero-grid">
              {nextElection ? (
                <NextElectionCard election={nextElection} />
              ) : (
                <div className="observer-next-election observer-empty-election">
                  <p className="observer-eyebrow">Next election</p>
                  <h2>{elections.isLoading ? 'Loading election schedule…' : 'No upcoming election'}</h2>
                  {!elections.isLoading && <p>No upcoming election is scheduled yet.</p>}
                </div>
              )}
              <section aria-labelledby="assignment-heading" className="observer-assignment">
                <div className="observer-assignment-heading">
                  <span className="observer-assignment-icon"><MapPin size={16} aria-hidden="true" /></span>
                  {isOfflineCopy && <span className="observer-pill">Offline copy</span>}
                  {!isOfflineCopy && !isLoading && !pollingUnit && <span className="observer-pill observer-pill-warning">Awaiting assignment</span>}
                </div>
                <p className="observer-eyebrow">Your polling unit</p>
                {isLoading ? (
                  <div className="observer-assignment-skeleton" />
                ) : pollingUnit ? (
                  <>
                    <h2>{pollingUnit.name}</h2>
                    <p className="observer-assignment-detail">{pollingUnit.pu_code} · {hasCoordinate ? 'Location verified' : 'Location needs verification'}</p>
                    <button className="observer-text-link" type="button" onClick={() => navigate(hasCoordinate ? '/checkin' : `/register-polling-unit?pu=${pollingUnit.id}`)}>
                      {hasCoordinate ? 'Check in now' : 'Verify location'} <ChevronRight size={12} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <h2>Assignment pending</h2>
                    <p className="observer-assignment-detail">Your admin will notify you when a polling unit has been assigned.</p>
                    <button className="observer-text-link" type="button" onClick={() => navigate('/assignment')}>Request an update <ChevronRight size={12} aria-hidden="true" /></button>
                  </>
                )}
              </section>
            </section>

            <section aria-labelledby="actions-heading" className="observer-actions-section">
              <div className="observer-section-heading">
                <div><p className="observer-eyebrow">Quick access</p><h2 id="actions-heading">Field actions</h2></div>
                <span>Essential tools for election day</span>
              </div>
              <div className="observer-actions-grid">
            <QuickAction
              icon={<AlertTriangle size={20} aria-hidden="true" />}
              title="Report incident"
              hint={pollingUnit ? 'Details, GPS and evidence' : 'Needs an assignment'}
              onClick={() => navigate('/report')}
              disabled={!pollingUnit}
              tone="action-report"
            />
            <QuickAction
              icon={<LocateFixed size={20} aria-hidden="true" />}
              title="Check in"
              hint={hasCoordinate ? 'Confirm you are on site' : 'After location approval'}
              onClick={() => navigate('/checkin')}
              disabled={!hasCoordinate}
              tone="action-checkin"
            />
            <QuickAction
              icon={<UserPlus size={20} aria-hidden="true" />}
              title="Register polling unit"
              hint="Add or verify a unit's location"
              onClick={() => navigate('/register-polling-unit')}
              tone="action-register"
            />
            <QuickAction
              icon={<ClipboardList size={20} aria-hidden="true" />}
              title="Inbox"
              hint="Assignments and updates"
              onClick={scrollToInbox}
              tone="action-inbox"
              badge={inbox.data?.unread_count}
            />
          </div>
        </section>

            <section className="observer-lower-grid">
              <div className="observer-elections-card"><UpcomingElections /></div>
              <section aria-labelledby="sync-heading" className="observer-sync-card">
                <div className="observer-section-heading observer-sync-heading">
                  <div><p className="observer-eyebrow">Status</p><h2 id="sync-heading">Sync activity</h2></div>
                  <span className="observer-pill">{isSyncing ? 'Syncing now' : isOnline ? 'Ready to sync' : 'Waiting for network'}</span>
                </div>
                <dl className="observer-sync-stats">
                  <div><dt>Queued</dt><dd>{pendingCount}</dd></div>
                  <div><dt>Synced</dt><dd>{stats.synced}</dd></div>
                  <div><dt>Attention</dt><dd className={failedCount > 0 ? 'has-errors' : ''}>{failedCount}</dd></div>
                </dl>
                <p className="observer-sync-note"><Upload size={12} aria-hidden="true" /> Your offline data is encrypted on this device.</p>
              </section>
            </section>

            <div className="observer-inbox-card"><InboxPanel /></div>
          </div>
        </main>
      </div>
    </div>
  );
};
