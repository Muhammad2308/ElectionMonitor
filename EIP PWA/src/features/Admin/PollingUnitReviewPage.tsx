import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Camera,
  Search,
  Layers,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Alert, Badge, Button } from '../../components/UI';
import { formatDateTime, getRelativeTime } from '../../utils/formatting';
import {
  geographyAPI,
  pollingUnitSubmissionsAPI,
  type GeoPollingUnit,
  type PollingUnitSubmission,
  type SubmissionStatus,
} from '../PollingUnits/api';

const CONFLICT_DISTANCE_M = 200;

const SUBMISSION_TABS: { id: SubmissionStatus; label: string }[] = [
  { id: 'pending', label: 'Pending Review' },
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
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-slate-700/50 text-xs text-slate-500 bg-slate-900/40">
        Photo unavailable
      </div>
    );
  }
  if (!src) {
    return <div className="h-24 animate-pulse rounded-lg bg-slate-800/60" aria-label={`Loading ${label}`} />;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block group" aria-label={`Open ${label} full size`}>
      <img
        src={src}
        alt={label}
        className="h-24 w-full rounded-lg object-cover border border-slate-700/50 group-hover:border-blue-500/50 transition-colors"
      />
    </a>
  );
};

// ── Register / Edit Modal for State Admin ────────────────────────────────────
interface RegisterModalProps {
  pu: GeoPollingUnit;
  onClose: () => void;
  onSuccess: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ pu, onClose, onSuccess }) => {
  const [lat, setLat] = useState(pu.latitude?.toString() ?? '');
  const [lng, setLng] = useState(pu.longitude?.toString() ?? '');
  const [name, setName] = useState(pu.name);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(pu.image_url);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setError(err.message || 'Failed to obtain current GPS location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('latitude', lat.trim());
      formData.append('longitude', lng.trim());
      if (name.trim()) formData.append('name', name.trim());
      if (file) formData.append('image', file);

      return geographyAPI.register(pu.id, formData);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {pu.pu_code}
              </span>
              <span className="text-xs text-slate-400">{pu.lga_name} · {pu.ward_name}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Register Polling Unit</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && <Alert variant="error" title="Submission failed">{error}</Alert>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Polling Unit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 12.0021"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. 8.5919"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleCaptureGPS}
            disabled={locating}
            className="flex items-center justify-center gap-2 border border-slate-700 text-xs py-2 text-slate-300"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} className="text-blue-400" />}
            {locating ? 'Acquiring GPS fix...' : 'Pinpoint Current GPS Location'}
          </Button>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Polling Unit Verification Photo
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-4 text-xs font-medium text-slate-300 hover:border-blue-500/60 transition-colors">
                <Camera size={16} className="text-blue-400" />
                <span>{file ? file.name : 'Choose or capture photo'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {preview && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={!lat || !lng || mutation.isPending}
            isLoading={mutation.isPending}
            className="flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            Save & Set Registered
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Submission Card (Reviewing field observer captures) ──────────────────────
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
    queryClient.invalidateQueries({ queryKey: ['geography', 'pu-stats'] });
    queryClient.invalidateQueries({ queryKey: ['geography', 'polling-units'] });
  };

  const approve = useMutation({
    mutationFn: () =>
      pollingUnitSubmissionsAPI.approve(s.id, {
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

  const approveDisabled = isNew && !puCode.trim();
  const rejectDisabled = !note.trim();

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4 shadow-sm hover:border-slate-700/70 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
            <Badge variant="info">{isNew ? 'New PU Proposal' : 'Official PU GPS'}</Badge>
            {conflict && <Badge variant="danger">Location Discrepancy</Badge>}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {s.ward?.lga_name} · Ward: {s.ward?.name}
            {s.polling_unit && ` · ${s.polling_unit.pu_code}`}
          </p>
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {getRelativeTime(s.created_at)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-slate-800/80 text-xs text-slate-300">
        <div>
          <span className="text-slate-500 block">Submitted By</span>
          <span className="font-medium text-white">{s.submitter?.name ?? 'Observer'}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Accuracy</span>
          <span className="font-medium text-white">±{Math.round(s.accuracy_m)}m</span>
        </div>
        <div>
          <span className="text-slate-500 block">GPS Coordinates</span>
          <a
            href={mapLink(s.latitude, s.longitude)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-blue-400 hover:underline flex items-center gap-1"
          >
            {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
            <ExternalLink size={10} />
          </a>
        </div>
        <div>
          <span className="text-slate-500 block">Captured At</span>
          <span className="font-medium text-white">{formatDateTime(s.captured_at)}</span>
        </div>
      </div>

      {s.photos && s.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {s.photos.map((photo, index) => (
            <EvidencePhoto key={photo.id} url={photo.url} label={`Evidence photo ${index + 1}`} />
          ))}
        </div>
      )}

      {conflict && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>
            Captured position is {Math.round(s.distance_from_existing_m!)}m away from prior records. Approving will update the master database.
          </span>
        </div>
      )}

      {s.status === 'rejected' && s.review_note && (
        <p className="text-xs text-red-300 bg-red-950/20 border border-red-800/30 rounded-xl p-2.5">
          <strong className="text-red-400">Rejected reason:</strong> {s.review_note}
        </p>
      )}

      {s.status === 'pending' && mode === 'idle' && (
        <div className="flex items-center gap-3 pt-1">
          <Button variant="success" onClick={() => setMode('approve')} className="text-xs py-2 px-4">
            Approve & Register
          </Button>
          <Button variant="danger" onClick={() => setMode('reject')} className="text-xs py-2 px-4">
            Reject
          </Button>
        </div>
      )}

      {s.status === 'pending' && mode === 'approve' && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-900/80 p-3.5">
          {isNew && (
            <input
              value={puCode}
              onChange={(e) => setPuCode(e.target.value)}
              placeholder="Official pu_code (required)"
              maxLength={50}
              className="rounded-xl border border-slate-700/50 bg-slate-950/70 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isNew ? `Official name (defaults to "${s.proposed_name}")` : 'Name override (optional)'}
            maxLength={255}
            className="rounded-xl border border-slate-700/50 bg-slate-950/70 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={() => approve.mutate()}
              disabled={approveDisabled || approve.isPending}
              isLoading={approve.isPending}
              className="text-xs py-2"
            >
              Confirm & Update Database
            </Button>
            <Button variant="ghost" onClick={() => { setMode('idle'); setError(null); }} className="text-xs py-2">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {s.status === 'pending' && mode === 'reject' && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-900/80 p-3.5">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection (sent to observer's inbox)"
            maxLength={500}
            rows={2}
            className="rounded-xl border border-slate-700/50 bg-slate-950/70 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => reject.mutate()}
              disabled={rejectDisabled || reject.isPending}
              isLoading={reject.isPending}
              className="text-xs py-2"
            >
              Confirm Rejection
            </Button>
            <Button variant="ghost" onClick={() => { setMode('idle'); setError(null); }} className="text-xs py-2">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <Alert variant="error" title="Action failed">{error}</Alert>}
    </article>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
export const PollingUnitReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'registry' | 'submissions'>('registry');

  // Registry filter state
  const [selectedLga, setSelectedLga] = useState<number | undefined>(undefined);
  const [selectedWard, setSelectedWard] = useState<number | undefined>(undefined);
  const [regStatus, setRegStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingPu, setEditingPu] = useState<GeoPollingUnit | null>(null);

  // Submissions filter state
  const [subStatus, setSubStatus] = useState<SubmissionStatus>('pending');

  // Stats query
  const statsQuery = useQuery({
    queryKey: ['geography', 'pu-stats'],
    queryFn: () => geographyAPI.stats(),
  });
  const stats = statsQuery.data;

  // LGAs and Wards queries
  const lgasQuery = useQuery({
    queryKey: ['geography', 'lgas'],
    queryFn: () => geographyAPI.lgas(),
  });
  const lgas = lgasQuery.data ?? [];

  const wardsQuery = useQuery({
    queryKey: ['geography', 'wards', selectedLga],
    queryFn: () => geographyAPI.wards(selectedLga),
  });
  const wards = wardsQuery.data ?? [];

  // Polling units list query
  const puQuery = useQuery({
    queryKey: ['geography', 'polling-units', { lga_id: selectedLga, ward_id: selectedWard, is_registered: regStatus, search, page }],
    queryFn: () =>
      geographyAPI.pollingUnits({
        lga_id: selectedLga,
        ward_id: selectedWard,
        is_registered: regStatus !== 'all' ? regStatus : undefined,
        search: search.trim() || undefined,
        page,
        per_page: 20,
      }),
    enabled: activeTab === 'registry',
  });

  // Submissions list query
  const submissionsQuery = useQuery({
    queryKey: ['admin', 'pu-submissions', subStatus],
    queryFn: () => pollingUnitSubmissionsAPI.list(subStatus),
    enabled: activeTab === 'submissions',
  });

  const puList = puQuery.data?.data ?? [];
  const meta = puQuery.data?.meta;
  const submissionsList = submissionsQuery.data?.data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-[eipFadeUp_0.4s_ease-out_both]">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                State Administration
              </span>
              <span className="text-xs text-slate-500 font-medium">INEC Master Hierarchy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Polling Unit Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Select polling units from the database to register GPS locations and verification photos, or review observer submissions.
            </p>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Polling Units</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats?.total ? stats.total.toLocaleString() : '...'}
              </span>
              <Layers size={18} className="text-slate-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Registered & Verified</span>
              {stats?.registered_pct !== undefined && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  {stats.registered_pct}%
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {stats?.registered !== undefined ? stats.registered.toLocaleString() : '...'}
              </span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Unregistered</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {stats?.unregistered !== undefined ? stats.unregistered.toLocaleString() : '...'}
              </span>
              <AlertCircle size={18} className="text-amber-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Observer Queue</span>
              {stats && stats.pending_submissions > 0 && (
                <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded animate-pulse">
                  Action Needed
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">
                {stats?.pending_submissions !== undefined ? stats.pending_submissions : 0}
              </span>
              <Clock size={18} className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Master Navigation Switcher */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'registry'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers size={16} />
            Official Database Registry
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
              activeTab === 'submissions'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera size={16} />
            Field Submissions
            {stats && stats.pending_submissions > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-slate-950">
                {stats.pending_submissions}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: OFFICIAL DATABASE REGISTRY ───────────────────────────── */}
        {activeTab === 'registry' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* LGA Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Local Govt (LGA)
                </label>
                <select
                  value={selectedLga ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setSelectedLga(val);
                    setSelectedWard(undefined);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All LGAs</option>
                  {lgas.map((lga) => (
                    <option key={lga.id} value={lga.id}>{lga.name}</option>
                  ))}
                </select>
              </div>

              {/* Ward Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Ward
                </label>
                <select
                  value={selectedWard ?? ''}
                  onChange={(e) => {
                    setSelectedWard(e.target.value ? Number(e.target.value) : undefined);
                    setPage(1);
                  }}
                  disabled={!selectedLga && wards.length === 0}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">All Wards</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Registration Status
                </label>
                <select
                  value={regStatus}
                  onChange={(e) => {
                    setRegStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Polling Units</option>
                  <option value="1">Registered & Verified Only</option>
                  <option value="0">Unregistered Only</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Search Name or Code
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="e.g. S20-L381 or School"
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Results Table / Cards */}
            {puQuery.isLoading && (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 size={28} className="animate-spin text-blue-500 mb-2" />
                <span className="text-sm">Querying polling units from database...</span>
              </div>
            )}

            {puQuery.isError && (
              <Alert variant="error" title="Failed to load polling units">
                {extractError(puQuery.error)}
              </Alert>
            )}

            {!puQuery.isLoading && puList.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8">
                <Layers size={36} className="mx-auto text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-white">No Polling Units Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No records match your selected LGA, Ward, or search term in this state. Try adjusting your filters.
                </p>
              </div>
            )}

            {!puQuery.isLoading && puList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {puList.map((pu) => {
                  const hasCoords = pu.latitude !== null && pu.longitude !== null;
                  return (
                    <div
                      key={pu.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                              {pu.pu_code}
                            </span>
                            {pu.is_registered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <CheckCircle2 size={11} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <AlertCircle size={11} /> Unregistered
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white truncate capitalize" title={pu.name}>
                            {pu.name.replace(/-/g, ' ')}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {pu.lga_name} · Ward: {pu.ward_name}
                          </p>
                        </div>

                        {pu.image_url && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                            <img src={pu.image_url} alt="PU" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="text-slate-400">
                          {hasCoords ? (
                            <a
                              href={mapLink(pu.latitude!, pu.longitude!)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <MapPin size={12} />
                              {pu.latitude!.toFixed(4)}, {pu.longitude!.toFixed(4)}
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">No GPS coordinates</span>
                          )}
                        </div>

                        <Button
                          variant={pu.is_registered ? 'ghost' : 'primary'}
                          onClick={() => setEditingPu(pu)}
                          className="text-xs py-1.5 px-3"
                        >
                          {pu.is_registered ? 'Edit Location / Image' : 'Register Location'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
                <span>
                  Showing page <strong className="text-white">{meta.current_page}</strong> of{' '}
                  <strong className="text-white">{meta.last_page}</strong> ({meta.total.toLocaleString()} total)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.current_page <= 1}
                    className="p-2 text-xs"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    disabled={meta.current_page >= meta.last_page}
                    className="p-2 text-xs"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: OBSERVER FIELD SUBMISSIONS ───────────────────────────── */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {SUBMISSION_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSubStatus(t.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    subStatus === t.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {submissionsQuery.isLoading && (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
                <span>Loading submissions...</span>
              </div>
            )}

            {submissionsQuery.isError && (
              <Alert variant="error" title="Failed to load field submissions">
                {extractError(submissionsQuery.error)}
              </Alert>
            )}

            {!submissionsQuery.isLoading && submissionsList.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8">
                <CheckCircle2 size={36} className="mx-auto text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-white">No {subStatus} submissions</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  When field observers capture locations and photos with their devices, their pending submissions will appear here for verification.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {submissionsList.map((s) => (
                <SubmissionCard key={s.id} submission={s} />
              ))}
            </div>
          </div>
        )}

        {/* Register Modal */}
        {editingPu && (
          <RegisterModal
            pu={editingPu}
            onClose={() => setEditingPu(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['geography', 'pu-stats'] });
              queryClient.invalidateQueries({ queryKey: ['geography', 'polling-units'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default PollingUnitReviewPage;
