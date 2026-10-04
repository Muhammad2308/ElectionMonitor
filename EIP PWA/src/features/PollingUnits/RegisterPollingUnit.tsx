import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Crosshair, MapPin, Search, CheckCircle2, Clock, XCircle, X } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Alert, Badge, Button } from '../../components/UI';
import { formatDateTime } from '../../utils/formatting';
import {
  geographyAPI,
  pollingUnitSubmissionsAPI,
  type GeoPollingUnit,
  type PollingUnitSubmission,
} from './api';

// Matches the server-side limits in StorePollingUnitSubmissionRequest.
const MAX_ACCURACY_M = 100;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

type Mode = 'existing' | 'new';

interface Fix {
  latitude: number;
  longitude: number;
  accuracy_m: number;
  captured_at: string;
}

const statusVariant: Record<string, 'warning' | 'success' | 'danger'> = {
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
  return data?.message ?? 'Submission failed. Check your connection and try again.';
};

export const RegisterPollingUnit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { position, error: gpsError, startTracking } = useGeolocation();

  const [mode, setMode] = useState<Mode>('existing');
  const [search, setSearch] = useState('');
  const presetPuId = Number(searchParams.get('pu'));
  const [selectedPuId, setSelectedPuId] = useState<number | null>(
    Number.isInteger(presetPuId) && presetPuId > 0 ? presetPuId : null
  );
  const [wardId, setWardId] = useState<number | null>(null);
  const [proposedName, setProposedName] = useState('');
  const [fix, setFix] = useState<Fix | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<PollingUnitSubmission | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    const stop = startTracking();
    return () => {
      if (stop) stop();
    };
  }, [startTracking]);

  const photosRef = React.useRef<PendingPhoto[]>([]);
  photosRef.current = photos;
  useEffect(() => {
    return () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  const clearPhotos = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotoError(null);
    const accepted: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!PHOTO_TYPES.includes(file.type)) {
        setPhotoError('Photos must be JPEG, PNG or WebP.');
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setPhotoError('Each photo must be 8 MB or smaller.');
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    const room = MAX_PHOTOS - photos.length;
    if (accepted.length > room) {
      setPhotoError(`You can attach up to ${MAX_PHOTOS} photos.`);
      accepted.slice(room).forEach((p) => URL.revokeObjectURL(p.previewUrl));
    }
    setPhotos((current) => [...current, ...accepted.slice(0, Math.max(room, 0))]);
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  const pollingUnits = useQuery({
    queryKey: ['polling-units', 'geography'],
    queryFn: () => geographyAPI.pollingUnits(),
    staleTime: 10 * 60 * 1000,
  });

  const wards = useQuery({
    queryKey: ['geography', 'wards'],
    queryFn: () => geographyAPI.wards(),
    enabled: mode === 'new',
    staleTime: 10 * 60 * 1000,
  });

  const mine = useQuery({
    queryKey: ['polling-units', 'mine'],
    queryFn: () => pollingUnitSubmissionsAPI.mine(),
  });

  const matches = useMemo<GeoPollingUnit[]>(() => {
    const all = pollingUnits.data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all.slice(0, 30);
    return all
      .filter((pu) => pu.name.toLowerCase().includes(q) || pu.pu_code.toLowerCase().includes(q))
      .slice(0, 30);
  }, [pollingUnits.data, search]);

  const selectedPu = useMemo(
    () => (pollingUnits.data?.data ?? []).find((pu) => pu.id === selectedPuId) ?? null,
    [pollingUnits.data, selectedPuId]
  );

  const accuracyOk = position !== null && position.accuracy <= MAX_ACCURACY_M;

  const captureFix = () => {
    if (!position || !accuracyOk) return;
    setFix({
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy_m: position.accuracy,
      captured_at: new Date(position.timestamp).toISOString(),
    });
  };

  const canSubmit =
    fix !== null &&
    photos.length > 0 &&
    (mode === 'existing' ? selectedPuId !== null : wardId !== null && proposedName.trim().length > 0);

  const submit = useMutation({
    mutationFn: (form: FormData) => pollingUnitSubmissionsAPI.submit(form),
    onSuccess: (res) => {
      setLastSubmitted(res.data);
      setFormError(null);
      setFix(null);
      setSelectedPuId(null);
      setProposedName('');
      setWardId(null);
      setSearch('');
      clearPhotos();
      queryClient.invalidateQueries({ queryKey: ['polling-units', 'mine'] });
    },
    onError: (err) => setFormError(extractError(err)),
  });

  const handleSubmit = () => {
    if (!fix || !canSubmit) return;
    setFormError(null);

    const form = new FormData();
    form.append('latitude', String(fix.latitude));
    form.append('longitude', String(fix.longitude));
    form.append('accuracy_m', String(fix.accuracy_m));
    form.append('captured_at', fix.captured_at);
    if (mode === 'existing') {
      form.append('submission_type', 'coordinates');
      form.append('polling_unit_id', String(selectedPuId));
    } else {
      form.append('submission_type', 'new_polling_unit');
      form.append('ward_id', String(wardId));
      form.append('proposed_name', proposedName.trim());
    }
    photos.forEach((p) => form.append('photos[]', p.file, p.file.name));

    submit.mutate(form);
  };

  const toggleClass = (active: boolean) =>
    `flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-300 border border-slate-700/50'
    }`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      <div className="max-w-xl mx-auto px-4 pt-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-800" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Register polling unit</h1>
            <p className="text-sm text-slate-400">Stand at the polling point, capture its GPS fix, and submit for review.</p>
          </div>
        </div>

        {lastSubmitted && (
          <Alert variant="success" title="Submitted for review">
            {lastSubmitted.submission_type === 'new_polling_unit'
              ? `"${lastSubmitted.proposed_name}" is awaiting admin approval.`
              : `Location for ${lastSubmitted.polling_unit?.name ?? 'the polling unit'} is awaiting admin approval.`}
          </Alert>
        )}

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">1. What are you registering?</h2>
          <div className="flex gap-2">
            <button className={toggleClass(mode === 'existing')} onClick={() => setMode('existing')}>On the list</button>
            <button className={toggleClass(mode === 'new')} onClick={() => setMode('new')}>Not on the list</button>
          </div>

          {mode === 'existing' ? (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or PU code"
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              {pollingUnits.isLoading && <p className="text-sm text-slate-400">Loading polling units…</p>}
              <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {matches.map((pu) => (
                  <li key={pu.id}>
                    <button
                      onClick={() => setSelectedPuId(pu.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${
                        selectedPuId === pu.id ? 'border-blue-500 bg-blue-600/15' : 'border-slate-700/50 bg-slate-900/40 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-sm font-semibold">{pu.name}</div>
                      <div className="text-xs text-slate-400">
                        {pu.pu_code} · {pu.latitude !== null ? 'coordinates on file' : 'no coordinates yet'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {selectedPu && (
                <p className="text-xs text-slate-400">
                  Selected: <span className="text-slate-200">{selectedPu.name}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <select
                value={wardId ?? ''}
                onChange={(e) => setWardId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Select ward…</option>
                {(wards.data ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <input
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                maxLength={255}
                placeholder="Polling unit name as displayed on the ground"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-slate-500">An admin assigns the official code when approving.</p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">2. Capture the location</h2>

          {gpsError && <Alert variant="error" title="Location unavailable">{gpsError}</Alert>}

          <div className="flex items-center gap-3 text-sm">
            <MapPin size={18} className={accuracyOk ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="text-slate-300">
              {position
                ? `Live accuracy ±${Math.round(position.accuracy)} m`
                : 'Waiting for GPS signal…'}
            </span>
          </div>
          {position && !accuracyOk && (
            <p className="text-xs text-amber-300">
              Accuracy must be within {MAX_ACCURACY_M} m. Move to an open area and wait for the signal to tighten.
            </p>
          )}

          {fix ? (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <CheckCircle2 size={16} /> Fix captured
              </div>
              <div className="text-slate-300 mt-1">
                {fix.latitude.toFixed(6)}, {fix.longitude.toFixed(6)} · ±{Math.round(fix.accuracy_m)} m
              </div>
              <button onClick={() => setFix(null)} className="text-xs text-blue-400 mt-2 underline">Recapture</button>
            </div>
          ) : (
            <Button variant="secondary" onClick={captureFix} disabled={!accuracyOk} fullWidth>
              <Crosshair size={16} /> Capture location
            </Button>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Photo evidence</h2>
          <p className="text-xs text-slate-400">
            Photograph the polling point and its sign so the admin can confirm the location. Attach 1–{MAX_PHOTOS} photos.
          </p>

          {photos.length < MAX_PHOTOS && (
            <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 py-4 text-sm font-semibold text-slate-300 cursor-pointer hover:bg-slate-800">
              <Camera size={18} /> {photos.length === 0 ? 'Take or choose photos' : 'Add another photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {photoError && <p className="text-xs text-amber-300">{photoError}</p>}

          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {photos.map((p, index) => (
                <li key={p.previewUrl} className="relative">
                  <img src={p.previewUrl} alt={`Evidence ${index + 1}`} className="h-24 w-full rounded-lg object-cover border border-slate-700/50" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-1 text-slate-200 hover:text-red-300"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photos.length === 0 && <p className="text-xs text-amber-300">At least one photo is required.</p>}
        </section>

        {formError && <Alert variant="error" title="Could not submit">{formError}</Alert>}

        <Button onClick={handleSubmit} disabled={!canSubmit || submit.isPending} isLoading={submit.isPending} fullWidth size="lg">
          Submit for review
        </Button>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your submissions</h2>
          {mine.isLoading && <p className="text-sm text-slate-400">Loading…</p>}
          {!mine.isLoading && (mine.data?.data ?? []).length === 0 && (
            <p className="text-sm text-slate-500">Nothing submitted yet.</p>
          )}
          <ul className="flex flex-col gap-2">
            {(mine.data?.data ?? []).map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {s.submission_type === 'new_polling_unit'
                        ? s.proposed_name
                        : s.polling_unit?.name ?? 'Polling unit'}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {formatDateTime(s.captured_at)}
                    </div>
                  </div>
                  <Badge variant={statusVariant[s.status] ?? 'default'}>{s.status}</Badge>
                </div>
                {s.status === 'rejected' && s.review_note && (
                  <div className="mt-2 flex gap-2 text-xs text-red-300">
                    <XCircle size={14} className="shrink-0 mt-0.5" /> {s.review_note}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default RegisterPollingUnit;
