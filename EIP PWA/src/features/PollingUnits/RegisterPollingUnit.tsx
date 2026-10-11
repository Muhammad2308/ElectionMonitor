import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import axios from 'axios';
import {
  ArrowLeft,
  Camera,
  Crosshair,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Layers,
  Info,
  RotateCw,
} from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Alert, Badge, Button } from '../../components/UI';
import { formatDateTime } from '../../utils/formatting';
import { db, type QueuedAction } from '../../storage/db';
import { syncManager } from '../../api/SyncManager';
import { useSyncStore } from '../../store/useSyncStore';
import {
  geographyAPI,
  pollingUnitSubmissionsAPI,
  type GeoPollingUnit,
  type PollingUnitSubmission,
} from './api';

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const DEFAULT_NIGERIA_CENTER: [number, number] = [9.082, 8.6753];

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

type Mode = 'existing' | 'new';

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

// Map click listener component
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Map center controller component
const MapCenterController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [center, map]);
  return null;
};

export const RegisterPollingUnit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { position, startTracking } = useGeolocation();

  const [mode, setMode] = useState<Mode>('existing');
  const [search, setSearch] = useState('');
  const presetPuId = Number(searchParams.get('pu'));
  const [selectedPuId, setSelectedPuId] = useState<number | null>(
    Number.isInteger(presetPuId) && presetPuId > 0 ? presetPuId : null
  );
  const [wardId, setWardId] = useState<number | null>(null);
  const [proposedName, setProposedName] = useState('');

  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');
  const [accuracyM, setAccuracyM] = useState<number>(10);
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [coordsSource, setCoordsSource] = useState<'gps' | 'manual' | 'map' | 'unset'>('unset');

  const [lastSubmitted, setLastSubmitted] = useState<PollingUnitSubmission | null>(null);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const isOnline = useSyncStore((s) => s.isOnline);
  const queuedSubmissions = useLiveQuery(
    () => db.queued_actions.filter((action) => action.type === 'POLLING_UNIT_SUBMISSION').toArray(),
    [],
  ) ?? [];

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
      if (!PHOTO_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        setPhotoError('Photos must be JPEG, PNG, JPG or WebP.');
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setPhotoError('Each photo must be 10 MB or smaller.');
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
    queryFn: () => geographyAPI.pollingUnits({ all: true }),
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

  // Set location from GPS
  const handleCaptureLiveGPS = () => {
    setFormError(null);
    if (position) {
      setLatInput(position.latitude.toFixed(6));
      setLngInput(position.longitude.toFixed(6));
      setAccuracyM(Math.round(position.accuracy || 10));
      setCapturedAt(new Date(position.timestamp || Date.now()).toISOString());
      setCoordsSource('gps');
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatInput(pos.coords.latitude.toFixed(6));
          setLngInput(pos.coords.longitude.toFixed(6));
          setAccuracyM(Math.round(pos.coords.accuracy || 10));
          setCapturedAt(new Date(pos.timestamp || Date.now()).toISOString());
          setCoordsSource('gps');
        },
        (err) => {
          setFormError(`Could not capture GPS: ${err.message}. You can set the pin on the map or enter coordinates manually.`);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setFormError('This device does not support GPS. Choose a point on the map or enter coordinates manually.');
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    setAccuracyM(5);
    setCapturedAt(new Date().toISOString());
    setCoordsSource('map');
    setFormError(null);
  };

  const parsedLat = parseFloat(latInput);
  const parsedLng = parseFloat(lngInput);
  const hasValidCoords =
    !isNaN(parsedLat) &&
    !isNaN(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180;

  const currentMapCenter: [number, number] = hasValidCoords
    ? [parsedLat, parsedLng]
    : DEFAULT_NIGERIA_CENTER;

  const canSubmit =
    hasValidCoords && coordsSource !== 'unset' &&
    (coordsSource !== 'gps' || accuracyM <= 100) &&
    photos.length > 0 &&
    (mode === 'existing' ? selectedPuId !== null : wardId !== null && proposedName.trim().length > 0);

  useEffect(() => {
    const onSynced = (event: Event) => {
      if ((event as CustomEvent<{ type?: string }>).detail?.type === 'POLLING_UNIT_SUBMISSION') {
        queryClient.invalidateQueries({ queryKey: ['polling-units', 'mine'] });
      }
    };
    window.addEventListener('sync:action-complete', onSynced);
    return () => window.removeEventListener('sync:action-complete', onSynced);
  }, [queryClient]);

  const resetForm = () => {
    setLatInput('');
    setLngInput('');
    setAccuracyM(10);
    setCapturedAt(new Date().toISOString());
    setCoordsSource('unset');
    setSelectedPuId(null);
    setProposedName('');
    setWardId(null);
    setSearch('');
    clearPhotos();
  };

  const submit = useMutation({
    mutationFn: async (submission: { payload: Record<string, unknown>; form: FormData }) => {
      if (!navigator.onLine || !isOnline) {
        await syncManager.queueAction('POLLING_UNIT_SUBMISSION', submission.payload, 10);
        return { queued: true as const };
      }
      try {
        const response = await pollingUnitSubmissionsAPI.submit(submission.form);
        return { queued: false as const, data: response.data };
      } catch (error) {
        if (axios.isAxiosError(error) && !error.response) {
          await syncManager.queueAction('POLLING_UNIT_SUBMISSION', submission.payload, 10);
          return { queued: true as const };
        }
        throw error;
      }
    },
    onSuccess: (res) => {
      if (res.queued) {
        setQueuedMessage('Saved on this device. It will sync when your connection is available.');
        setLastSubmitted(null);
      } else {
        setLastSubmitted(res.data);
        setQueuedMessage(null);
      }
      setFormError(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['polling-units', 'mine'] });
    },
    onError: (err) => setFormError(extractError(err)),
  });

  const handleSubmit = () => {
    if (!hasValidCoords || !canSubmit) return;
    setFormError(null);

    const payload: Record<string, unknown> = {
      latitude: String(parsedLat),
      longitude: String(parsedLng),
      accuracy_m: String(accuracyM),
      captured_at: capturedAt || new Date().toISOString(),
      photos: photos.map(({ file }) => file),
    };

    if (mode === 'existing') {
      payload.submission_type = 'coordinates';
      payload.polling_unit_id = String(selectedPuId);
    } else {
      payload.submission_type = 'new_polling_unit';
      payload.ward_id = String(wardId);
      payload.proposed_name = proposedName.trim();
    }

    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'photos' && Array.isArray(value)) {
        value.forEach((photo) => form.append('photos[]', photo as Blob, (photo as File).name));
      } else form.append(key, String(value));
    });
    submit.mutate({ payload, form });
  };

  const toggleClass = (active: boolean) =>
    `flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Register Polling Unit
              </h1>
              <p className="text-xs text-slate-400">Capture GPS location & photo evidence for admin approval</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              title="Reload App"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCw size={15} />
            </button>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-300'}`} />
              {isOnline ? 'Online' : 'Offline'}
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-6">
        {queuedMessage && <Alert variant="success" title="Submission saved offline">{queuedMessage}</Alert>}
        {lastSubmitted && (
          <Alert variant="success" title="Submitted for Admin Review!">
            <div className="flex flex-col gap-1 text-xs">
              <p>
                {lastSubmitted.submission_type === 'new_polling_unit'
                  ? `New polling unit "${lastSubmitted.proposed_name}" has been recorded.`
                  : `Coordinates for ${lastSubmitted.polling_unit?.name ?? 'the polling unit'} submitted successfully.`}
              </p>
              <p className="text-emerald-400 font-medium">
                Your state administrator can now review the coordinates and approve the registration at /admin/polling-units.
              </p>
            </div>
          </Alert>
        )}

        {/* STEP 1: Identification */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold">1</span>
              What are you registering?
            </h2>
            <span className="text-[11px] text-slate-500">Step 1 of 3</span>
          </div>

          <div className="flex gap-2">
            <button className={toggleClass(mode === 'existing')} onClick={() => setMode('existing')}>
              Official List PU
            </button>
            <button className={toggleClass(mode === 'new')} onClick={() => setMode('new')}>
              New / Missing PU
            </button>
          </div>

          {mode === 'existing' ? (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, PU code, ward, or LGA..."
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {pollingUnits.isLoading && <p className="text-xs text-slate-400 py-2">Loading polling units database...</p>}

              <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {matches.map((pu) => {
                  const isSelected = selectedPuId === pu.id;
                  const hasCoords = pu.latitude !== null && pu.longitude !== null;
                  return (
                    <li key={pu.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPuId(pu.id);
                          if (hasCoords) {
                            setLatInput(String(pu.latitude));
                            setLngInput(String(pu.longitude));
                            setCoordsSource('unset');
                          }
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-600/15 shadow-sm'
                            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-white">{pu.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {pu.pu_code} {pu.ward_name && `· Ward: ${pu.ward_name}`} {pu.lga_name && `· LGA: ${pu.lga_name}`}
                            </div>
                          </div>
                          {hasCoords ? (
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              Registered
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                              Needs GPS
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {selectedPu && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <span className="text-slate-400">Selected PU:</span>{' '}
                      <strong className="text-white font-semibold">{selectedPu.name}</strong>{' '}
                      <span className="font-mono text-blue-400">({selectedPu.pu_code})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Select Ward
                </label>
                <select
                  value={wardId ?? ''}
                  onChange={(e) => setWardId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 py-3 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Choose ward...</option>
                  {(wards.data ?? []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Proposed Polling Unit Name
                </label>
                <input
                  value={proposedName}
                  onChange={(e) => setProposedName(e.target.value)}
                  maxLength={255}
                  placeholder="e.g. Primary School Open Space, Block B"
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 py-3 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  The state administrator will assign the official INEC PU Code when approving.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* STEP 2: Location & Coordinates Capture */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold">2</span>
              Capture Location & GPS Coordinates
            </h2>
            <span className="text-[11px] text-slate-500">Step 2 of 3</span>
          </div>

          {/* Quick GPS Capture Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${position ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                <MapPin size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-white">
                    {position
                      ? `Device GPS Live (±${Math.round(position.accuracy)}m)`
                      : 'GPS Coordinate Capture'}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Source: {coordsSource}
                  </span>
                </div>
              <div className="text-[11px] text-slate-400">
                  {position
                    ? `Lat: ${position.latitude.toFixed(5)}, Lng: ${position.longitude.toFixed(5)}`
                    : 'Capture live GPS, choose a point on the map, or enter coordinates manually'}
              </div>
              {coordsSource === 'gps' && accuracyM > 100 && <div className="text-[11px] text-amber-300">GPS accuracy must be 100 m or better. Move to an open area and recapture.</div>}
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleCaptureLiveGPS}
              className="shrink-0 flex items-center justify-center gap-2 text-xs py-2.5 px-4 font-bold"
            >
              <Crosshair size={16} />
              Capture Live GPS
            </Button>
          </div>

          {/* Editable Coordinates Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => {
                  setLatInput(e.target.value);
                  setCoordsSource('manual');
                  setCapturedAt(new Date().toISOString());
                }}
                placeholder="e.g. 12.990800"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 py-3 px-3.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => {
                  setLngInput(e.target.value);
                  setCoordsSource('manual');
                  setCapturedAt(new Date().toISOString());
                }}
                placeholder="e.g. 7.601800"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 py-3 px-3.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} /> Interactive Pinpoint Map
              </span>
              <span className="text-[11px] text-slate-500">Tap anywhere on map to drop pin</span>
            </div>

            <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-800 relative z-10 bg-slate-950">
              <MapContainer
                center={currentMapCenter}
                zoom={hasValidCoords ? 14 : 6}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                <MapClickHandler onLocationSelect={handleMapLocationSelect} />
                {hasValidCoords && <MapCenterController center={[parsedLat, parsedLng]} />}

                {hasValidCoords && (
                  <CircleMarker
                    center={[parsedLat, parsedLng]}
                    radius={9}
                    pathOptions={{
                      color: '#2563eb',
                      fillColor: '#60a5fa',
                      fillOpacity: 0.9,
                      weight: 3,
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </section>

        {/* STEP 3: Photo Evidence */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold">3</span>
              Photo Evidence
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Step 3 of 3</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Photograph the polling point, building entrance, or INEC signpost so the administrator can confirm and approve the location. Attach 1–{MAX_PHOTOS} photos.
          </p>

          {photos.length < MAX_PHOTOS && (
            <label className="flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 py-5 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:border-blue-500/60 hover:bg-slate-900/80 transition-all">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Camera size={20} />
              </div>
              <div className="text-center sm:text-left">
                <div>{photos.length === 0 ? 'Take or choose photo' : 'Add another photo'}</div>
                <div className="text-[11px] text-slate-500 font-normal">Supports camera capture, PNG, JPG, WebP</div>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
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
            <ul className="grid grid-cols-3 gap-3">
              {photos.map((p, index) => (
                <li key={p.previewUrl} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img
                    src={p.previewUrl}
                    alt={`Evidence ${index + 1}`}
                    className="h-28 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent opacity-80" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-slate-900/90 p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-900 transition-colors"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X size={14} />
                  </button>
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-slate-300">
                    Photo {index + 1}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {photos.length === 0 && (
            <p className="text-xs text-amber-300/80 flex items-center gap-1.5">
              <Info size={14} /> At least 1 photo is required for administrator review.
            </p>
          )}
        </section>

        {formError && <Alert variant="error" title="Submission Error">{formError}</Alert>}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submit.isPending}
          isLoading={submit.isPending}
          fullWidth
          size="lg"
          variant="primary"
          className="py-3.5 font-bold shadow-lg shadow-blue-600/20"
        >
          Submit Coordinates for Admin Review
        </Button>

        {/* Submissions History */}
        <section className="flex flex-col gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Location Submissions
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {(mine.data?.data ?? []).length} total
            </span>
          </div>

          {mine.isLoading && <p className="text-xs text-slate-400">Loading submissions history...</p>}

          {!mine.isLoading && (mine.data?.data ?? []).length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
              No submissions recorded yet on this device.
            </div>
          )}

          <ul className="flex flex-col gap-2.5">
            {queuedSubmissions.map((action: QueuedAction) => (
              <li key={action.id} className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {String(action.payload.proposed_name || (action.payload.submission_type === 'coordinates' ? `Polling unit ${action.payload.polling_unit_id}` : 'New polling unit'))}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">Saved {formatDateTime(action.created_at)} · {Array.isArray(action.payload.photos) ? action.payload.photos.length : 0} evidence photo(s)</div>
                    {action.last_error && <div className="mt-2 text-xs text-red-300">{action.last_error}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={action.status === 'failed' || action.status === 'conflict' ? 'danger' : action.status === 'synced' ? 'success' : 'warning'}>
                      {action.status === 'synced' ? 'Synced' : action.status === 'syncing' ? 'Syncing' : action.status === 'pending' ? 'Waiting to sync' : action.status}
                    </Badge>
                    {(action.status === 'failed' || action.status === 'conflict') && (
                      <button type="button" onClick={() => void syncManager.retryAction(action.id)} className="text-xs text-blue-300 hover:text-white">Retry</button>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {(mine.data?.data ?? []).map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {s.submission_type === 'new_polling_unit'
                        ? s.proposed_name
                        : s.polling_unit?.name ?? 'Polling unit'}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <span className="font-mono text-blue-400">
                        {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatDateTime(s.captured_at)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusVariant[s.status] ?? 'default'}>
                    {s.status === 'pending' ? 'Pending Review' : s.status}
                  </Badge>
                </div>

                {s.status === 'rejected' && s.review_note && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-red-950/30 border border-red-800/30 p-2.5 text-xs text-red-300">
                    <XCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                    <span><strong>Review Note:</strong> {s.review_note}</span>
                  </div>
                )}
                {s.status === 'approved' && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} /> Approved by Admin — Registered on Official Map
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
