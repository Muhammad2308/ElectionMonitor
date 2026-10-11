import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellRing } from 'lucide-react';
import { Link } from 'react-router-dom';
import { incidentsAPI } from './api';

const SOUND_ALERTS_KEY = 'admin-incident-sound-alerts';
let sharedAudioContext: AudioContext | null = null;

export const AdminIncidentNotifier: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_ALERTS_KEY) === 'true');
  const [message, setMessage] = useState('');
  const seenIds = useRef<Set<string> | null>(null);
  const lastCreatedAt = useRef(0);
  const alertTimer = useRef<number | null>(null);
  const incidents = useQuery({
    queryKey: ['admin', 'incident-notifications'],
    queryFn: () => incidentsAPI.list({ limit: 50 }),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const list = incidents.data?.data;
    if (!list) return;
    const ids = new Set(list.map((incident) => incident.id));
    if (seenIds.current === null) {
      seenIds.current = ids;
      lastCreatedAt.current = Math.max(0, ...list.map((incident) => new Date(incident.created_at).getTime()));
      return;
    }

    const fresh = list.filter((incident) =>
      !seenIds.current?.has(incident.id)
      && new Date(incident.created_at).getTime() > lastCreatedAt.current
    );
    ids.forEach((id) => seenIds.current?.add(id));
    lastCreatedAt.current = Math.max(
      lastCreatedAt.current,
      ...list.map((incident) => new Date(incident.created_at).getTime()),
    );
    if (fresh.length === 0) return;

    const incident = fresh[0];
    setMessage(`New ${incident.severity} incident · ${incident.category_name} · ${incident.polling_unit?.name ?? 'Polling unit'}`);
    if (alertTimer.current !== null) window.clearTimeout(alertTimer.current);
    alertTimer.current = window.setTimeout(() => setMessage(''), 12_000);

    if (soundEnabled && sharedAudioContext?.state === 'running') {
      try {
        const oscillator = sharedAudioContext.createOscillator();
        const gain = sharedAudioContext.createGain();
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.14, sharedAudioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + 0.45);
        oscillator.connect(gain);
        gain.connect(sharedAudioContext.destination);
        oscillator.start();
        oscillator.stop(sharedAudioContext.currentTime + 0.45);
      } catch {
        setMessage('A new incident arrived, but the sound alert could not be played.');
      }
    }
  }, [incidents.data, soundEnabled]);

  useEffect(() => () => {
    if (alertTimer.current !== null) window.clearTimeout(alertTimer.current);
  }, []);

  const toggleSound = async () => {
    try {
      if (soundEnabled) {
        localStorage.setItem(SOUND_ALERTS_KEY, 'false');
        setSoundEnabled(false);
        return;
      }
      sharedAudioContext ??= new AudioContext();
      await sharedAudioContext.resume();
      localStorage.setItem(SOUND_ALERTS_KEY, 'true');
      setSoundEnabled(true);
      setMessage('Sound alerts are enabled for new incidents.');
      if (alertTimer.current !== null) window.clearTimeout(alertTimer.current);
      alertTimer.current = window.setTimeout(() => setMessage(''), 3_000);
    } catch {
      setMessage('Sound could not be enabled. Check browser audio settings and try again.');
    }
  };

  return (
    <div className="fixed right-4 top-20 z-[100] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {message && (
        <div role="status" className="rounded-xl border border-amber-400/30 bg-slate-950/95 px-4 py-3 text-sm font-semibold text-amber-200 shadow-2xl">
          <Link to="/admin/incidents" className="hover:underline">{message} · View</Link>
        </div>
      )}
      {incidents.isError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-slate-950/95 px-3 py-2 text-xs text-rose-200">Incident notifications are unavailable.</p>}
      <button type="button" onClick={() => void toggleSound()} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 shadow-xl hover:border-blue-400">
        {soundEnabled ? <BellRing size={15} className="text-emerald-300" /> : <Bell size={15} />}
        {soundEnabled ? 'Sound on' : 'Enable sound alerts'}
      </button>
    </div>
  );
};

export default AdminIncidentNotifier;
