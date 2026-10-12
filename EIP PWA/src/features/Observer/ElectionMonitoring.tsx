import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, CircleStop, LoaderCircle, MapPin, Mic, Radio, ShieldAlert, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useMyAssignment } from '../Assignments/useMyAssignment';

type MediaType = 'image' | 'audio' | 'video';
type Attachment = { type: MediaType; file: File };
type IncidentCategory = { id: number; name: string };
type GeolocationPoint = { latitude: number; longitude: number; accuracy: number; capturedAt: string };

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 30;

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function extensionFor(mimeType: string, type: 'audio' | 'video'): string {
  if (mimeType.includes('mp4')) return type === 'audio' ? 'm4a' : 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('webm')) return 'webm';
  return type === 'audio' ? 'wav' : 'mp4';
}

export const ElectionMonitoring: React.FC = () => {
  const { assignment, isLoading } = useMyAssignment();
  const [monitoring, setMonitoring] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [point, setPoint] = useState<GeolocationPoint | null>(null);
  const [locationMessage, setLocationMessage] = useState('Location sharing is off.');
  const [locationError, setLocationError] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [incidentId, setIncidentId] = useState('');
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaError, setMediaError] = useState('');
  const watchId = useRef<number | null>(null);
  const lastLocationSentAt = useRef(0);
  const postingLocation = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const recordingParts = useRef<Blob[]>([]);
  const recordingTimer = useRef<number | null>(null);

  const categories = useQuery({
    queryKey: ['incident-categories'],
    queryFn: () => api.get<IncidentCategory[]>('/geography/categories'),
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    const capturedAt = new Date(position.timestamp).toISOString();
    const nextPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      capturedAt,
    };
    setPoint(nextPoint);
    setLocationError('');
    setLocationMessage(`GPS fix acquired (±${Math.round(position.coords.accuracy)} m).`);

    if (!navigator.onLine) {
      setLocationMessage('GPS fix acquired; waiting for an internet connection to share it.');
      return;
    }
    if (postingLocation.current || Date.now() - lastLocationSentAt.current < 20_000) return;

    postingLocation.current = true;
    try {
      await api.post('/observers/location', {
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        captured_at: capturedAt,
      });
      lastLocationSentAt.current = Date.now();
      setLocationMessage(`Live location shared · ±${Math.round(nextPoint.accuracy)} m accuracy.`);
    } catch (requestError) {
      setLocationError(errorMessage(requestError));
      setLocationMessage('GPS is available, but the latest location could not be shared.');
    } finally {
      postingLocation.current = false;
    }
  }, []);

  useEffect(() => {
    if (!monitoring) return undefined;
    watchId.current = navigator.geolocation.watchPosition(
      (position) => { void sendLocation(position); },
      (geoError) => {
        setLocationError(geoError.message);
        setLocationMessage(geoError.code === geoError.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access in browser settings.'
          : 'Unable to get a GPS fix. Check the device location setting and try again.');
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [monitoring, sendLocation]);

  useEffect(() => () => {
    if (recordingTimer.current !== null) window.clearInterval(recordingTimer.current);
    recorder.current?.stop();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startRecording = async (type: 'audio' | 'video') => {
    setMediaError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMediaError('This browser does not support recording. Use a recent browser or upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: type === 'audio',
        video: type === 'video' ? { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      mediaStream.current = stream;
      const candidates = type === 'audio'
        ? ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
        : ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const activeRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordingParts.current = [];
      activeRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingParts.current.push(event.data);
      };
      activeRecorder.onerror = () => setMediaError('Recording failed. Check microphone/camera permissions and try again.');
      activeRecorder.onstop = () => {
        if (recordingTimer.current !== null) window.clearInterval(recordingTimer.current);
        recordingTimer.current = null;
        const blob = new Blob(recordingParts.current, { type: activeRecorder.mimeType || (type === 'audio' ? 'audio/webm' : 'video/webm') });
        mediaStream.current?.getTracks().forEach((track) => track.stop());
        mediaStream.current = null;
        recorder.current = null;
        setRecordingType(null);
        setRecordingSeconds(0);
        if (blob.size > MAX_MEDIA_BYTES) {
          setMediaError('This recording is over 20 MB. Record a shorter clip and try again.');
          return;
        }
        const file = new File([blob], `observer-${type}-${Date.now()}.${extensionFor(blob.type, type)}`, { type: blob.type });
        setAttachments((existing) => [...existing.filter((item) => item.type !== type), { type, file }]);
      };
      recorder.current = activeRecorder;
      activeRecorder.start();
      setRecordingType(type);
      setRecordingSeconds(0);
      recordingTimer.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => {
          if (seconds + 1 >= MAX_RECORDING_SECONDS) recorder.current?.stop();
          return seconds + 1;
        });
      }, 1_000);
    } catch (recordError) {
      setMediaError(errorMessage(recordError));
      mediaStream.current?.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }
  };

  const attachImage = (file?: File) => {
    setMediaError('');
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      setMediaError('Choose an image smaller than 20 MB.');
      return;
    }
    setAttachments((existing) => [...existing.filter((item) => item.type !== 'image'), { type: 'image', file }]);
  };

  const uploadPendingMedia = async (id: string) => {
    const remaining = attachments.filter(({ type }) => !uploaded.includes(type));
    const failed: string[] = [];
    for (const attachment of remaining) {
      try {
        const form = new FormData();
        form.append('incident_id', id);
        form.append('type', attachment.type);
        form.append('file', attachment.file);
        await api.post('/incidents/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setUploaded((current) => [...current, attachment.type]);
      } catch {
        failed.push(attachment.type);
      }
    }
    return failed;
  };

  const submitIncident = async () => {
    if (!assignment || !selectedCategory || !point || !online || submitting) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      let id = incidentId;
      if (!id) {
        const response = await api.post<{ incident: { id: string } }>('/incidents/report', {
          polling_unit_id: assignment.polling_unit_id,
          category_id: Number(selectedCategory),
          severity,
          description: description.trim(),
          incident_time: new Date().toISOString(),
          latitude: point.latitude,
          longitude: point.longitude,
        });
        id = response.incident.id;
        setIncidentId(id);
      }
      const failed = await uploadPendingMedia(id);
      if (failed.length > 0) {
        setError(`Incident ${id} was recorded. Evidence upload failed for: ${failed.join(', ')}. Retry without creating a duplicate incident.`);
        return;
      }
      setNotice(`Incident sent to your state admin${attachments.length ? ' with all evidence' : ''}. Reference: ${id}`);
      setIncidentId('');
      setUploaded([]);
      setAttachments([]);
      setDescription('');
      setSelectedCategory('');
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submitIncident();
  };

  const toggleMonitoring = () => {
    setLocationError('');
    if (!monitoring) {
      if (!navigator.geolocation) {
        setLocationError('This browser does not provide geolocation.');
        setLocationMessage('Location is unavailable.');
        return;
      }
      lastLocationSentAt.current = 0;
      setLocationMessage('Requesting a high-accuracy GPS fix…');
    } else {
      setLocationMessage('Location sharing is off.');
    }
    setMonitoring((active) => !active);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 p-6 text-slate-300">Loading your polling-unit assignment…</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/assignment" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> My polling unit
        </Link>

        <header className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
                <ShieldAlert size={14} /> Presentation simulation
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Election-day observation</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                A sample election session for demonstration. The sample turnout figures below are illustrative only;
                reports, uploaded evidence, and any shared GPS location are real and visible to your state admin.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <Radio size={16} className="animate-pulse" />
              Sample election in progress
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SimulationCard label="Election" value="Sample General Election" />
            <SimulationCard label="Assigned polling unit" value={assignment?.polling_unit.name ?? 'No polling unit assigned'} />
            <SimulationCard label="Illustrative accredited voters" value="48 · sample only" />
          </div>
        </header>

        {!assignment && (
          <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-amber-200">
            No active polling-unit assignment was found. Ask your state coordinator to assign you before starting.
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-500/15 p-3 text-blue-300"><MapPin size={20} /></span>
              <div>
                <h2 className="text-lg font-bold">Observer live location</h2>
                <p className="mt-1 text-sm leading-5 text-slate-400">
                  Your device GPS is shared with authorized admins while monitoring is active. No polling-unit coordinates are substituted.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMonitoring}
              disabled={!assignment}
              className={`mt-5 w-full rounded-xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${monitoring ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {monitoring ? 'Stop sharing location' : 'Start monitoring & share GPS'}
            </button>
            <p className={`mt-3 text-sm ${locationError ? 'text-rose-300' : 'text-slate-400'}`} role={locationError ? 'alert' : undefined}>
              {locationError || locationMessage}
            </p>
            {point && (
              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)} · ±{Math.round(point.accuracy)} m
              </p>
            )}
            {!online && <p className="mt-3 text-sm text-amber-300">Offline — live GPS and incident delivery require an internet connection.</p>}
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300"><CheckCircle2 size={20} /></span>
              <div>
                <h2 className="text-lg font-bold">Observation checklist</h2>
                <p className="mt-1 text-sm text-slate-400">Illustrative progress for the sample election; not actual vote data.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <ChecklistItem label="Polling unit opened" value="08:00 · sample" />
              <ChecklistItem label="Accreditation observed" value="48 voters · sample" />
              <ChecklistItem label="Ballot counting" value="Awaiting sample update" />
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Real incident reporting</p>
            <h2 className="mt-1 text-xl font-bold">Report an incident</h2>
            <p className="mt-1 text-sm text-slate-400">Reports are sent to the backend immediately and appear in the admin incident feed.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-300">
                Incident category
                <select required value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                  <option value="">Select a category</option>
                  {(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                {categories.isError && <span role="alert" className="block text-xs text-rose-300">Incident categories could not be loaded. Refresh and try again.</span>}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-300">
                Severity
                <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                  {['low', 'medium', 'high', 'critical'].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-300">
              What happened?
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={3} placeholder="Describe what you observed…" className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600" />
            </label>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-300">Evidence · optional · maximum 20 MB each</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => void startRecording('audio')} disabled={!!recordingType} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:border-blue-400 disabled:opacity-50">
                  <Mic size={17} /> {recordingType === 'audio' ? `Recording ${recordingSeconds}s…` : 'Record voice'}
                </button>
                <button type="button" onClick={() => void startRecording('video')} disabled={!!recordingType} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:border-blue-400 disabled:opacity-50">
                  {recordingType === 'video' ? <CircleStop size={17} /> : <Video size={17} />}
                  {recordingType === 'video' ? `Recording ${recordingSeconds}s…` : 'Record short video'}
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:border-blue-400">
                  <Camera size={17} /> Upload image
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { attachImage(event.target.files?.[0]); event.target.value = ''; }} />
                </label>
              </div>
              {recordingType && <button type="button" onClick={() => recorder.current?.stop()} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold">Stop recording</button>}
              {mediaError && <p role="alert" className="mt-3 text-sm text-rose-300">{mediaError}</p>}
              {attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {attachments.map(({ type, file }) => (
                    <li key={type} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300">
                      <span>{type} · {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB {uploaded.includes(type) ? '· uploaded' : ''}</span>
                      <button type="button" aria-label={`Remove ${type}`} onClick={() => { setAttachments((items) => items.filter((item) => item.type !== type)); setUploaded((items) => items.filter((item) => item !== type)); }} className="text-slate-500 hover:text-white">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {notice && <p role="status" className="break-all rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-sm text-emerald-200">{notice}</p>}
            {error && <p role="alert" className="break-all rounded-xl border border-rose-500/20 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</p>}
            {incidentId && error && (
              <button type="button" disabled={submitting || !online} onClick={() => void submitIncident()} className="rounded-lg border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-200 disabled:opacity-50">
                Retry evidence upload
              </button>
            )}
            {!point && <p className="text-xs text-amber-200">Start monitoring and wait for a GPS fix before sending a report. Incidents include your actual device coordinates.</p>}
            <button type="submit" disabled={!assignment || !point || !online || !selectedCategory || submitting || !!recordingType} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-4 font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
              {submitting ? 'Sending incident and evidence…' : incidentId ? 'Retry evidence upload' : 'Send incident to admin'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

const SimulationCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-2 font-bold text-slate-100">{value}</p>
  </div>
);

const ChecklistItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 px-4 py-3">
    <span className="text-sm text-slate-300">{label}</span>
    <span className="text-right text-xs font-semibold text-amber-200">{value}</span>
  </div>
);

export default ElectionMonitoring;
