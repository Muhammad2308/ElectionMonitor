import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Circle } from 'lucide-react';
import { getRelativeTime } from '../../utils/formatting';
import { observerAPI, type InboxItem } from './api';

export const InboxPanel: React.FC = () => {
  const queryClient = useQueryClient();

  const inbox = useQuery({
    queryKey: ['observer', 'inbox'],
    queryFn: () => observerAPI.inbox(),
    refetchInterval: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['observer', 'inbox'] });

  const markRead = useMutation({
    mutationFn: (id: string) => observerAPI.markRead(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => observerAPI.markAllRead(),
    onSuccess: invalidate,
  });

  const items = inbox.data?.data ?? [];
  const unread = inbox.data?.unread_count ?? 0;

  return (
    <section id="inbox" aria-labelledby="inbox-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="inbox-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
          <Bell size={16} aria-hidden="true" /> Inbox
          {unread > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-black text-white" aria-label={`${unread} unread`}>
              {unread}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-sky-300 hover:bg-white/5"
          >
            <CheckCheck size={14} aria-hidden="true" /> Mark all read
          </button>
        )}
      </div>

      {inbox.isLoading && <p className="text-sm text-slate-400">Loading messages…</p>}
      {!inbox.isLoading && items.length === 0 && (
        <p className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 text-sm text-slate-400">
          You're all caught up. Assignments and account updates will appear here.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item: InboxItem) => {
          const isUnread = item.read_at === null;
          return (
            <li key={item.id}>
              <button
                onClick={() => isUnread && markRead.mutate(item.id)}
                className={`flex w-full min-h-11 items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  isUnread
                    ? 'border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/15'
                    : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <Circle
                  size={10}
                  aria-label={isUnread ? 'Unread' : 'Read'}
                  className={`mt-1.5 shrink-0 ${isUnread ? 'fill-blue-500 text-blue-500' : 'text-slate-600'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${isUnread ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>{item.title}</p>
                    <span className="shrink-0 text-[11px] text-slate-500">{getRelativeTime(item.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
