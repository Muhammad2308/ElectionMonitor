import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  AlertCircle,
  Crosshair,
  ShieldCheck,
  Radio,
  CloudOff,
  LogOut,
  LocateFixed,
  Ruler,
  Building2,
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';
import { useGeolocation, calculateDistance } from '../../hooks/useGeolocation';
import { syncManager } from '../../api/SyncManager';
import { useMyAssignment } from '../Assignments/useMyAssignment';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { ThemeToggle } from '../../components/UI/ThemeToggle';

const MAX_DISTANCE = 500; // 500 meters geofence radius

// Custom Marker Icons for Leaflet
const createPuIcon = () =>
  L.divIcon({
    className: 'custom-pu-icon',
    html: `
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const createUserIcon = (isWithinRange: boolean) =>
  L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div style="background: ${isWithinRange ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px ${isWithinRange ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'};">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

// Component to handle auto-fitting bounds to show both user & polling unit
const MapController: React.FC<{
  userPos: [number, number] | null;
  puPos: [number, number];
  recenterTrigger: number;
}> = ({ userPos, puPos, recenterTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (userPos) {
      const bounds = L.latLngBounds([userPos, puPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else {
      map.setView(puPos, 15);
    }
  }, [userPos, puPos, map, recenterTrigger]);

  return null;
};

export const CheckIn: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isOnline } = useSyncStore();
  const { position, hasLock, error: gpsError, startTracking } = useGeolocation();
  const { assignment, isLoading, refresh } = useMyAssignment();
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  useEffect(() => {
    const stop = startTracking();
    return () => {
      if (stop) stop();
    };
  }, [startTracking]);

  const assignedPU = assignment?.polling_unit;
  const assignedLatitude = assignedPU?.latitude;
  const assignedLongitude = assignedPU?.longitude;
  const hasVerifiedCoordinates =
    assignedLatitude !== null &&
    assignedLatitude !== undefined &&
    assignedLongitude !== null &&
    assignedLongitude !== undefined;

  const userPos: [number, number] | null = position
    ? [position.latitude, position.longitude]
    : null;

  const puPos: [number, number] | null = hasVerifiedCoordinates
    ? [assignedLatitude, assignedLongitude]
    : null;

  const distance =
    position && hasVerifiedCoordinates
      ? calculateDistance(
          position.latitude,
          position.longitude,
          assignedLatitude,
          assignedLongitude
        )
      : null;

  const isWithinRange = distance !== null && distance <= MAX_DISTANCE;

  const handleCheckIn = async () => {
    if (!position || !isWithinRange || !assignedPU) return;

    setCheckInStatus('submitting');
    try {
      await syncManager.queueAction(
        'CHECK_IN',
        {
          polling_unit_id: assignedPU.id,
          latitude: position.latitude,
          longitude: position.longitude,
          check_in_time: new Date().toISOString(),
          distance_from_pu: Math.round(distance!),
        },
        10
      );
      setCheckInStatus('done');
    } catch (e) {
      console.error(e);
      setCheckInStatus('idle');
    }
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const formatDistance = (m: number) => {
    if (m < 1000) return `${Math.round(m)}m`;
    return `${(m / 1000).toFixed(2)} km`;
  };

  if (isLoading) {
    return (
      <div className="field-shell">
        <style>{css}</style>
        <header className="field-header">
          <div className="brand">
            <div className="brand-mark">E</div>
            <div>
              <strong>ElectWatch</strong>
              <span>FIELD OPERATIONS</span>
            </div>
          </div>
        </header>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="font-semibold text-slate-300">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignedPU || !hasVerifiedCoordinates || !puPos) {
    return (
      <div className="field-shell">
        <style>{css}</style>
        <header className="field-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Back
          </button>
          <div className="brand">
            <div className="brand-mark">E</div>
            <div>
              <strong>ElectWatch</strong>
              <span>CHECK-IN</span>
            </div>
          </div>
          <ThemeToggle />
        </header>
        <main className="field-main">
          <div className="empty-card">
            <AlertCircle size={44} className="text-amber-500 mb-3" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              No Approved Coordinates
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
              {!assignedPU
                ? 'You currently have no active polling unit assignment.'
                : 'This polling unit does not have verified GPS coordinates yet. Please verify the polling unit location first.'}
            </p>
            <button
              className="secondary-action max-w-xs"
              onClick={() => navigate(assignedPU ? '/assignment' : '/dashboard')}
            >
              {assignedPU ? 'Verify Polling Unit Location' : 'Return to Dashboard'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="field-shell">
      <style>{css}</style>
      <header className="field-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <strong>ElectWatch</strong>
            <span>PRESENCE VERIFICATION</span>
          </div>
        </div>

        <div className={`connection ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Radio size={14} /> : <CloudOff size={14} />}
          {isOnline ? 'Connected' : 'Offline mode'}
        </div>

        <ThemeToggle />

        <button className="profile" onClick={signOut} aria-label="Sign out">
          <span>{user?.name?.slice(0, 1).toUpperCase() ?? 'O'}</span>
          <LogOut size={17} />
        </button>
      </header>

      <main className="field-main">
        <section className="intro">
          <div>
            <p className="eyebrow">FIELD PRESENCE VERIFICATION</p>
            <h1>Check In at Polling Unit</h1>
            <p>Verify your physical presence within the 500m geofence of your assigned polling unit.</p>
          </div>
          <button
            className="refresh"
            onClick={() => {
              void refresh();
              setRecenterTrigger((prev) => prev + 1);
            }}
          >
            <RefreshCw size={16} /> Recenter map
          </button>
        </section>

        <div className="checkin-grid">
          {/* Left Column: Live Geofence Map */}
          <section className="map-card">
            <div className="card-kicker">
              <span>
                <Navigation size={15} /> LIVE LOCATION & GEOFENCE MAP
              </span>
              <span className={`status-pill ${isWithinRange ? 'within' : 'outside'}`}>
                {isWithinRange ? 'Within Range (✓)' : 'Outside Geofence (✗)'}
              </span>
            </div>

            <div className="map-container">
              <MapContainer
                center={puPos}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                <MapController userPos={userPos} puPos={puPos} recenterTrigger={recenterTrigger} />

                {/* Polling Unit Marker */}
                <Marker position={puPos} icon={createPuIcon()}>
                  <Popup>
                    <div className="p-1">
                      <strong className="text-blue-600 block font-bold text-sm">
                        {assignedPU.name}
                      </strong>
                      <span className="text-xs text-slate-500 block">{assignedPU.pu_code}</span>
                      <span className="text-xs text-slate-400 block mt-1">
                        Target Coordinates: {puPos[0].toFixed(5)}, {puPos[1].toFixed(5)}
                      </span>
                    </div>
                  </Popup>
                </Marker>

                {/* 500m Geofence Circle */}
                <Circle
                  center={puPos}
                  radius={MAX_DISTANCE}
                  pathOptions={{
                    color: isWithinRange ? '#10b981' : '#ef4444',
                    fillColor: isWithinRange ? '#10b981' : '#ef4444',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '6, 6',
                  }}
                />

                {/* Observer GPS Marker */}
                {userPos && (
                  <Marker position={userPos} icon={createUserIcon(isWithinRange)}>
                    <Popup>
                      <div className="p-1">
                        <strong className="text-slate-800 dark:text-slate-100 block font-bold text-sm">
                          Your Current Location
                        </strong>
                        <span className="text-xs text-slate-500 block">
                          GPS Accuracy: ±{Math.round(position?.accuracy ?? 0)}m
                        </span>
                        <span className="text-xs text-slate-500 block">
                          Distance to PU: {distance ? formatDistance(distance) : 'Calculating...'}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Connecting Line between User & Polling Unit */}
                {userPos && (
                  <Polyline
                    positions={[userPos, puPos]}
                    pathOptions={{
                      color: isWithinRange ? '#059669' : '#dc2626',
                      weight: 3,
                      opacity: 0.8,
                      dashArray: '8, 8',
                    }}
                  />
                )}
              </MapContainer>

              {/* Map Floating Legend Overlay */}
              <div className="map-overlay-legend">
                <div className="legend-item">
                  <span className="dot pu-dot" /> <strong>Assigned PU</strong>
                </div>
                <div className="legend-item">
                  <span className={`dot user-dot ${isWithinRange ? 'green' : 'red'}`} />{' '}
                  <strong>Your GPS</strong>
                </div>
                <div className="legend-item">
                  <span className={`circle-ring ${isWithinRange ? 'green' : 'red'}`} />{' '}
                  <strong>500m Zone</strong>
                </div>
              </div>

              <button
                className="recenter-map-btn"
                onClick={() => setRecenterTrigger((t) => t + 1)}
                title="Fit map to show user and polling unit"
              >
                <Crosshair size={18} />
              </button>
            </div>

            {/* Map Telemetry Bar */}
            <div className="map-telemetry">
              <div className="telemetry-block">
                <span className="label">TARGET PU COORDINATE</span>
                <span className="value">
                  {puPos[0].toFixed(5)}, {puPos[1].toFixed(5)}
                </span>
              </div>
              <div className="telemetry-block">
                <span className="label">OBSERVER GPS LOCATION</span>
                <span className="value">
                  {userPos
                    ? `${userPos[0].toFixed(5)}, ${userPos[1].toFixed(5)}`
                    : 'Acquiring GPS lock...'}
                </span>
              </div>
              <div className="telemetry-block">
                <span className="label">LIVE DISTANCE</span>
                <span className={`value highlight ${isWithinRange ? 'text-green-600' : 'text-red-600'}`}>
                  {distance !== null ? formatDistance(distance) : '--'}
                </span>
              </div>
            </div>
          </section>

          {/* Right Column: Telemetry & Actions */}
          <section className="side-column">
            {/* Polling Unit Info Card */}
            <article className="pu-info-card">
              <div className="card-kicker">
                <span>
                  <Building2 size={15} /> ASSIGNED POLLING UNIT
                </span>
                <span className="verified-badge">
                  <CheckCircle2 size={13} /> Verified Coordinates
                </span>
              </div>
              <h2>{assignedPU.name}</h2>
              <p className="pu-code">{assignedPU.pu_code}</p>

              <div className="distance-progress-container">
                <div className="progress-header">
                  <span>Distance to Polling Unit</span>
                  <strong>{distance !== null ? formatDistance(distance) : 'Calculating...'}</strong>
                </div>

                {/* Visual Distance Gauge Bar */}
                <div className="progress-track">
                  <div
                    className={`progress-fill ${isWithinRange ? 'in-range' : 'out-range'}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          distance !== null ? (1 - Math.min(distance, 2000) / 2000) * 100 : 0
                        )
                      )}%`,
                    }}
                  />
                  <div className="geofence-marker" style={{ left: '75%' }} title="500m Limit" />
                </div>
                <div className="progress-footer">
                  <span>0m</span>
                  <span className="limit-label">Max Allowed: 500m</span>
                  <span>2km+</span>
                </div>
              </div>
            </article>

            {/* GPS Lock & Signal Card */}
            <article className="telemetry-card">
              <div className="card-kicker">
                <span>
                  <Compass size={15} /> SATELLITE TELEMETRY
                </span>
                <span className={`gps-badge ${hasLock ? 'locked' : 'acquiring'}`}>
                  <MapPin size={13} /> {hasLock ? 'High Accuracy Lock' : 'Acquiring Signal...'}
                </span>
              </div>

              <div className="telemetry-grid">
                <div className="tele-item">
                  <LocateFixed size={18} className="text-blue-500" />
                  <div>
                    <strong>GPS Accuracy</strong>
                    <span>±{position ? Math.round(position.accuracy) : '--'} meters</span>
                  </div>
                </div>

                <div className="tele-item">
                  <Ruler size={18} className={isWithinRange ? 'text-emerald-500' : 'text-amber-500'} />
                  <div>
                    <strong>Geofence Status</strong>
                    <span className={isWithinRange ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {distance === null
                        ? 'Calculating...'
                        : isWithinRange
                        ? 'Within 500m Geofence'
                        : `${formatDistance(distance - MAX_DISTANCE)} outside boundary`}
                    </span>
                  </div>
                </div>
              </div>

              {gpsError && (
                <div className="gps-error-alert">
                  <AlertCircle size={16} />
                  <span>{gpsError}</span>
                </div>
              )}
            </article>

            {/* Check-In Action Card */}
            <article className="action-box">
              {checkInStatus === 'done' ? (
                <div className="checkin-success">
                  <CheckCircle2 size={42} className="text-emerald-500 mb-2" />
                  <h3>Check-In Verified!</h3>
                  <p>Your presence has been successfully registered and queued for sync.</p>
                  <span className="timestamp">
                    <Clock size={13} /> Checked in at {new Date().toLocaleTimeString()}
                  </span>
                  <button className="secondary-action mt-4" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <div className="action-intro">
                    <ShieldCheck size={20} className="text-emerald-600" />
                    <div>
                      <h3>Ready to Confirm Presence?</h3>
                      <p>
                        {isWithinRange
                          ? 'You are at your assigned polling unit. Click below to submit your official check-in.'
                          : 'You must move within 500 meters of the polling unit to enable check-in.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckIn}
                    disabled={!isWithinRange || checkInStatus === 'submitting'}
                    className={`checkin-submit-btn ${
                      isWithinRange ? 'active' : 'disabled'
                    }`}
                  >
                    {checkInStatus === 'submitting' ? (
                      <>
                        <RefreshCw size={20} className="spin" /> Submitting Check-In...
                      </>
                    ) : isWithinRange ? (
                      <>
                        <CheckCircle2 size={22} /> Confirm & Check In Now
                      </>
                    ) : (
                      <>
                        <Navigation size={20} /> Move closer to Polling Unit
                      </>
                    )}
                  </button>
                </>
              )}
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};

const css = `
.field-shell {
  min-height: 100vh;
  background: #f4f7fb;
  color: #142033;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.dark .field-shell {
  background: #0b1524;
  color: #e2e8f0;
}

.field-header {
  height: 76px;
  background: #071b33;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 clamp(20px, 5vw, 72px);
  gap: 16px;
  border-bottom: 1px solid #163452;
}

.back-btn {
  background: #102a46;
  border: 1px solid #234668;
  color: #93c5fd;
  border-radius: 9px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #1a3c61;
  color: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(145deg, #2c85ff, #1745a5);
  display: grid;
  place-items: center;
  font-size: 19px;
  font-weight: 900;
}

.brand strong, .brand span {
  display: block;
}

.brand strong {
  font-size: 16px;
}

.brand span {
  font-size: 9px;
  letter-spacing: .16em;
  color: #8ba7c6;
  margin-top: 2px;
}

.connection {
  margin-left: auto;
  padding: 7px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.connection.online {
  color: #79f0b6;
  background: #123d38;
}

.connection.offline {
  color: #ffd479;
  background: #493817;
}

.profile {
  border: 1px solid #31516f;
  background: #102a46;
  color: #fff;
  border-radius: 10px;
  padding: 5px 8px 5px 5px;
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}

.profile span {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #e3edff;
  color: #154892;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.field-main {
  max-width: 1240px;
  margin: 0 auto;
  padding: 36px clamp(20px, 5vw, 52px) 72px;
}

.intro {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
  gap: 20px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: .12em;
  font-weight: 800;
  color: #2563eb;
  margin: 0 0 8px;
}

.intro h1 {
  font-size: clamp(26px, 4vw, 36px);
  letter-spacing: -.04em;
  margin: 0;
  font-weight: 800;
}

.intro p:not(.eyebrow) {
  color: #64748b;
  margin: 7px 0 0;
}

.refresh {
  background: #fff;
  border: 1px solid #d9e2ef;
  border-radius: 9px;
  padding: 10px 14px;
  color: #31445d;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}

.dark .refresh {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.checkin-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 24px;
}

.map-card, .pu-info-card, .telemetry-card, .action-box, .empty-card {
  background: #fff;
  border: 1px solid #dce5f0;
  border-radius: 16px;
  box-shadow: 0 8px 30px #1e3b5a0b;
}

.dark .map-card, .dark .pu-info-card, .dark .telemetry-card, .dark .action-box, .dark .empty-card {
  background: #111c2e;
  border-color: #1e2d42;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}

.map-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
}

.card-kicker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #5c718b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .07em;
  margin-bottom: 14px;
}

.dark .card-kicker {
  color: #8ab0d0;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.status-pill.within {
  background: #d1fae5;
  color: #065f46;
}

.status-pill.outside {
  background: #fee2e2;
  color: #991b1b;
}

.map-container {
  height: 380px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.dark .map-container {
  border-color: #334155;
}

.map-overlay-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 400;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.dark .map-overlay-legend {
  background: rgba(15, 23, 42, 0.92);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.pu-dot {
  background: #2563eb;
}

.user-dot.green {
  background: #10b981;
}

.user-dot.red {
  background: #ef4444;
}

.circle-ring {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px dashed #10b981;
}

.circle-ring.red {
  border-color: #ef4444;
}

.recenter-map-btn {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 400;
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.dark .recenter-map-btn {
  background: #1e293b;
  color: #f1f5f9;
  border-color: #475569;
}

.map-telemetry {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.dark .map-telemetry {
  border-top-color: #1e293b;
}

.telemetry-block .label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .06em;
  color: #64748b;
}

.telemetry-block .value {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 3px;
  font-family: ui-monospace, monospace;
}

.dark .telemetry-block .value {
  color: #e2e8f0;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pu-info-card, .telemetry-card, .action-box {
  padding: 22px;
}

.pu-info-card h2 {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -.02em;
  margin: 4px 0 2px;
}

.pu-code {
  font-family: ui-monospace, monospace;
  color: #475569;
  font-size: 13px;
  margin: 0 0 16px;
}

.dark .pu-code {
  color: #94a3b8;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #059669;
  background: #ecfdf5;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.distance-progress-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
}

.dark .distance-progress-container {
  background: #0f172a;
  border-color: #1e293b;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.progress-track {
  height: 10px;
  background: #e2e8f0;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.dark .progress-track {
  background: #334155;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease;
}

.progress-fill.in-range {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-fill.out-range {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.geofence-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #3b82f6;
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 6px;
}

.limit-label {
  color: #3b82f6;
  font-weight: 700;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 10px;
}

.tele-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.dark .tele-item {
  background: #0f172a;
  border-color: #1e293b;
}

.tele-item strong, .tele-item span {
  display: block;
}

.tele-item strong {
  font-size: 12px;
  color: #475569;
}

.dark .tele-item strong {
  color: #94a3b8;
}

.tele-item span {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.dark .tele-item span {
  color: #f8fafc;
}

.gps-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.gps-badge.locked {
  color: #059669;
}

.gps-badge.acquiring {
  color: #d97706;
}

.action-intro {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.action-intro h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
}

.action-intro p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.checkin-submit-btn {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkin-submit-btn.active {
  background: linear-gradient(135deg, #059669, #10b981);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.checkin-submit-btn.active:hover {
  background: linear-gradient(135deg, #047857, #059669);
  transform: translateY(-1px);
}

.checkin-submit-btn.disabled {
  background: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}

.dark .checkin-submit-btn.disabled {
  background: #334155;
  color: #64748b;
}

.checkin-success {
  text-align: center;
  padding: 10px 0;
}

.checkin-success h3 {
  font-size: 20px;
  font-weight: 800;
  color: #059669;
  margin: 0 0 6px;
}

.checkin-success p {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px;
}

.timestamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #059669;
  background: #ecfdf5;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 700;
}

.secondary-action {
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 12px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.empty-card {
  padding: 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .checkin-grid {
    grid-template-columns: 1fr;
  }
  .map-container {
    height: 300px;
  }
}
`;
