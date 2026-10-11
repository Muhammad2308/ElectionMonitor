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
    <section id="inbox" aria-labelledby="inbox-heading" className="observer-inbox">
      <div className="observer-inbox-heading">
        <h2 id="inbox-heading">
          <span className="observer-eyebrow">Messages</span>
          <span>Inbox</span>
          {unread > 0 && (
            <span className="observer-inbox-count" aria-label={`${unread} unread`}>
              {unread}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="observer-mark-read"
          >
            <CheckCheck size={13} aria-hidden="true" /> Mark all read
          </button>
        )}
      </div>

      {inbox.isLoading && <p className="observer-empty-state">Loading messages…</p>}
      {!inbox.isLoading && items.length === 0 && (
        <p className="observer-empty-state">
          You're all caught up. Assignments and account updates will appear here.
        </p>
      )}

      <ul className="observer-inbox-list">
        {items.map((item: InboxItem) => {
          const isUnread = item.read_at === null;
          return (
            <li key={item.id}>
              <button
                onClick={() => isUnread && markRead.mutate(item.id)}
                className={`observer-inbox-item ${isUnread ? 'is-unread' : ''}`}
              >
                <Circle size={8} aria-label={isUnread ? 'Unread' : 'Read'} className={`observer-inbox-dot ${isUnread ? 'is-unread' : ''}`} />
                <span className="observer-inbox-icon"><Bell size={14} aria-hidden="true" /></span>
                <div className="observer-inbox-copy">
                  <div className="observer-inbox-item-heading">
                    <strong>{item.title}</strong>
                    <span>{getRelativeTime(item.created_at)}</span>
                  </div>
                  <p>{item.body}</p>
                </div>
                <span className="observer-inbox-arrow" aria-hidden="true">›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
