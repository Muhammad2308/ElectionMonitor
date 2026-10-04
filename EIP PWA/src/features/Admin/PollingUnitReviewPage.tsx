import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, MapPin } from 'lucide-react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Alert, Badge, Button } from '../../components/UI';
import { formatDateTime, getRelativeTime } from '../../utils/formatting';
import { pollingUnitSubmissionsAPI, type PollingUnitSubmission, type SubmissionStatus } from '../PollingUnits/api';

// Coordinates further than this from the polling unit's existing coordinates are flagged for a closer look.
const CONFLICT_DISTANCE_M = 200;

const TABS: { id: SubmissionStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const statusVariant: Record<SubmissionStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const extractError = (err: any): string => {
  const data = err?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0] as string[] | undefined;
    if (first?.[0]) return first[0];
  }
  return data?.message ?? 'Action failed. Try again.';
};

const mapLink = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;

// <img> cannot send the bearer token, so evidence is fetched as a blob and shown from an object URL.
const EvidencePhoto: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    pollingUnitSubmissionsAPI
      .photoBlob(url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (failed) {
    return <div className="flex h-24 items-center justify-center rounded-lg border border-slate-700/50 text-xs text-slate-500">Unavailable</div>;
  }
  if (!src) {
    return <div className="h-24 animate-pulse rounded-lg bg-slate-700/40" aria-label={`Loading ${label}`} />;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block" aria-label={`Open ${label} full size`}>
      <img src={src} alt={label} className="h-24 w-full rounded-lg object-cover border border-slate-700/50" />
    </a>
  );
};

const SubmissionCard: React.FC<{ submission: PollingUnitSubmission }> = ({ submission: s }) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [puCode, setPuCode] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isNew = s.submission_type === 'new_polling_unit';
  const title = isNew ? s.proposed_name : s.polling_unit?.name;
  const conflict = s.distance_from_existing_m !== null && s.distance_from_existing_m > CONFLICT_DISTANCE_M;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'pu-submissions'] });
  };

  const approve = useMutation({
    mutationFn: () => pollingUnitSubmissionsAPI.approve(s.id, {
      ...(isNew ? { pu_code: puCode.trim() } : {}),
      ...(name.trim() ? { name: name.trim() } : {}),
    }),
    onSuccess: refresh,
    onError: (err) => setError(extractError(err)),
  });

  const reject = useMutation({
    mutationFn: () => pollingUnitSubmissionsAPI.reject(s.id, note.trim()),
    onSuccess: refresh,
    onError: (err) => setError(extractError(err)),
  });

  const approveDisabled = approve.isPending || (isNew && puCode.trim() === '');
  const rejectDisabled = reject.isPending || note.trim() === '';

  return (
    <article className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white truncate">{title ?? 'Unnamed polling unit'}</h3>
            <Badge variant={isNew ? 'info' : 'default'}>{isNew ? 'New PU' : 'Coordinates'}</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {s.ward ? `${s.ward.name}${s.ward.lga_name ? ` · ${s.ward.lga_name}` : ''}` : ''}
            {!isNew && s.polling_unit?.pu_code ? ` · ${s.polling_unit.pu_code}` : ''}
          </p>
        </div>
        <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-900/50 p-3">
          <div className="text-xs uppercase tracking-wider text-slate-500">Submitted by</div>
          <div className="text-white font-semibold">{s.submitter?.name ?? '—'}</div>
          <div className="text-slate-400 text-xs">
            {s.submitter?.user_code ?? ''}{s.submitter?.role_type ? ` · ${s.submitter.role_type.replace(/_/g, ' ')}` : ''}
          </div>
          <div className="text-slate-400 text-xs">{s.submitter?.email}</div>
        </div>

        <div className="rounded-xl bg-slate-900/50 p-3">
          <div className="text-xs uppercase tracking-wider text-slate-500">Captured location</div>
          <div className="text-white font-mono text-sm">
            {s.latitude.toFixed(6)}, {s.longitude.toFixed(6)}
          </div>
          <div className="text-slate-400 text-xs">
            ±{Math.round(s.accuracy_m)} m · {formatDateTime(s.captured_at)} ({getRelativeTime(s.captured_at)})
          </div>
          <a href={mapLink(s.latitude, s.longitude)} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-2">
            <MapPin size={12} /> View on map <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {s.photos && s.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {s.photos.map((photo, index) => (
            <EvidencePhoto key={photo.id} url={photo.url} label={`Evidence photo ${index + 1}`} />
          ))}
        </div>
      )}

      {conflict && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-200">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Captured location is {Math.round(s.distance_from_existing_m!)} m from the coordinates already on file.
            Check the map before approving — this will overwrite them.
          </span>
        </div>
      )}

      {s.status === 'rejected' && s.review_note && (
        <p className="text-sm text-red-300">Rejected: {s.review_note}</p>
      )}

      {s.status === 'pending' && mode === 'idle' && (
        <div className="flex gap-3">
          <Button variant="success" onClick={() => setMode('approve')}>Approve</Button>
          <Button variant="danger" onClick={() => setMode('reject')}>Reject</Button>
        </div>
      )}

      {s.status === 'pending' && mode === 'approve' && (
        <div className="flex flex-col gap-3">
          {isNew && (
            <input
              value={puCode}
              onChange={(e) => setPuCode(e.target.value)}
              placeholder="Official pu_code (required)"
              maxLength={50}
              className="rounded-xl border border-slate-700/50 bg-slate-900/60 py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isNew ? `Official name (defaults to "${s.proposed_name}")` : 'Name override (optional)'}
            maxLength={255}
            className="rounded-xl border border-slate-700/50 bg-slate-900/60 py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
          <div className="flex gap-3">
            <Button variant="success" onClick={() => approve.mutate()} disabled={approveDisabled} isLoading={approve.isPending}>
              Confirm approval
            </Button>
            <Button variant="ghost" onClick={() => { setMode('idle'); setError(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {s.status === 'pending' && mode === 'reject' && (
        <div className="flex flex-col gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection (shown to the observer)"
            maxLength={500}
            rows={3}
            className="rounded-xl border border-slate-700/50 bg-slate-900/60 py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => reject.mutate()} disabled={rejectDisabled} isLoading={reject.isPending}>
              Confirm rejection
            </Button>
            <Button variant="ghost" onClick={() => { setMode('idle'); setError(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {error && <Alert variant="error" title="Could not complete">{error}</Alert>}
    </article>
  );
};

export const PollingUnitReviewPage: React.FC = () => {
  const [status, setStatus] = useState<SubmissionStatus>('pending');

  const submissions = useQuery({
    queryKey: ['admin', 'pu-submissions', status],
    queryFn: () => pollingUnitSubmissionsAPI.list(status),
  });

  const list = submissions.data?.data ?? [];

  return (
    <AdminLayout>
      <div className="animate-[eipFadeUp_0.6s_ease-out_both] max-w-5xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <h2 className="font-black text-white tracking-tight" style={{ fontSize: '32px' }}>Polling unit registrations</h2>
          <p className="font-medium text-slate-400" style={{ fontSize: '15px', marginTop: '6px' }}>
            Observer-captured locations. Approve to publish the coordinates; reject with a reason to send it back.
          </p>
        </div>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                status === t.id ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-300 border border-slate-700/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {submissions.isLoading && <p className="text-slate-400">Loading…</p>}
        {submissions.isError && <Alert variant="error" title="Could not load">{extractError(submissions.error)}</Alert>}
        {!submissions.isLoading && list.length === 0 && (
          <p className="text-slate-500">No {status} registrations.</p>
        )}

        <div className="flex flex-col gap-4">
          {list.map((s) => (
            <SubmissionCard key={s.id} submission={s} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PollingUnitReviewPage;
