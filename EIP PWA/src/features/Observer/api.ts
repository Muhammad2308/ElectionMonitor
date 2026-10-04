import api from '../../api';

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface InboxResponse {
  data: InboxItem[];
  unread_count: number;
}

export interface UpcomingElection {
  id: number;
  title: string;
  starts_at: string;
  accreditation_starts_at: string | null;
  status: 'scheduled' | 'active' | 'postponed';
  election_name: string;
  election_type: string;
  scope: 'national' | 'state';
  state_name: string | null;
}

export const observerAPI = {
  inbox: (): Promise<InboxResponse> => api.get('/inbox'),
  markRead: (id: string): Promise<unknown> => api.post(`/inbox/${id}/read`),
  markAllRead: (): Promise<unknown> => api.post('/inbox/read-all'),
  upcomingElections: (): Promise<{ data: UpcomingElection[] }> => api.get('/elections/upcoming'),
};
