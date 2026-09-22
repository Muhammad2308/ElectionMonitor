import React, { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, ArrowLeft, CheckCircle2, Crosshair, LoaderCircle, MapPin, Navigation, Send, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../storage/db';
import { useAuthStore } from '../../store/useAuthStore';
import { syncManager } from '../../api/SyncManager';
import { useMyAssignment } from '../Assignments/useMyAssignment';
import { useGeolocation } from '../../hooks/useGeolocation';
import { ThemeToggle } from '../../components/UI/ThemeToggle';

const categories = [{ id: 1, name: 'Violence' }, { id: 2, name: 'Vote buying' }, { id: 3, name: 'Ballot snatching' }, { id: 4, name: 'Delayed opening' }];
const nigeria: [number, number] = [9.082, 8.6753];

const MapFollower: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 16, { duration: 0.8 }); }, [center, map]);
  return null;
};

export const IncidentForm: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { assignment, isLoading: assignmentLoading } = useMyAssignment();
  const { position, hasLock, error: gpsError, startTracking } = useGeolocation();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => startTracking(), [startTracking]);
  const pollingUnit = assignment?.polling_unit;
  const puPosition = pollingUnit?.latitude != null && pollingUnit?.longitude != null ? [pollingUnit.latitude, pollingUnit.longitude] as [number, number] : null;
  const currentPosition: [number, number] = position ? [position.latitude, position.longitude] : (puPosition ?? nigeria);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCategory || !user || !assignment) return;
    setIsSaving(true);
    try {
      const incident = {
        id: crypto.randomUUID(), user_id: user.id, polling_unit_id: assignment.polling_unit_id, category_id: selectedCategory,
        description, incident_time: new Date().toISOString(), latitude: position?.latitude ?? null, longitude: position?.longitude ?? null,
        sync_status: 'pending' as const, created_at: new Date().toISOString(),
      };
      await db.incidents.add(incident);
      await syncManager.queueAction('CREATE_INCIDENT', incident, 20);
      setDescription(''); setSelectedCategory(null);
      navigate('/dashboard');
    } finally { setIsSaving(false); }
  };

  if (assignmentLoading) return <div className="report-loading"><LoaderCircle className="spin" /> Loading your field assignment…</div>;
  if (!assignment || !pollingUnit) return <div className="report-loading"><AlertTriangle /> No active polling-unit assignment is available.</div>;

  return <div className="report-shell"><style>{css}</style>
    <header className="report-header"><button onClick={() => navigate('/dashboard')}><ArrowLeft size={19} /> Back</button><div><strong>ElectWatch</strong><span>SECURE FIELD REPORT</span></div><div className="secure"><ShieldCheck size={16} /> Encrypted queue</div><ThemeToggle /></header>
    <main className="report-main"><section className="report-intro"><p className="eyebrow">NEW INCIDENT REPORT</p><h1>Record what you are seeing.</h1><p>Your report is saved securely on this device first, then synchronized when a connection is available.</p></section>
      <div className="report-grid"><form className="incident-form" onSubmit={handleSave}>
        <div className="form-head"><div className="form-icon"><AlertTriangle size={22} /></div><div><h2>Incident details</h2><p>Describe the situation accurately and objectively.</p></div></div>
        <fieldset><legend>Incident category</legend><div className="category-grid">{categories.map((category) => <button type="button" key={category.id} onClick={() => setSelectedCategory(category.id)} className={selectedCategory === category.id ? 'selected' : ''}><span className="choice-dot" />{category.name}</button>)}</div></fieldset>
        <label className="description-label">What happened?<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} placeholder="Describe the incident, who is involved, and what action is needed…" /></label><div className="character-count">{description.length}/5000</div>
        <div className="evidence-note"><ShieldCheck size={18} /><span><strong>Evidence is protected.</strong> Add photos or video in the next step; each file will be integrity-checked before upload.</span></div>
        <button className="submit-report" type="submit" disabled={!selectedCategory || isSaving}>{isSaving ? <LoaderCircle className="spin" /> : <Send size={19} />}{isSaving ? 'Saving secure report…' : 'Save incident report'}<ArrowLeft className="arrow" size={17} /></button>
      </form>
      <aside className="location-panel"><div className="location-head"><div><p className="eyebrow">LIVE LOCATION</p><h2><MapPin size={19} /> {pollingUnit.name}</h2><span>{pollingUnit.pu_code}</span></div><div className={hasLock ? 'gps-pill locked' : 'gps-pill'}><Crosshair size={14} />{hasLock ? 'GPS locked' : 'Locating'}</div></div>
        <div className="live-map"><MapContainer center={currentPosition} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" /><MapFollower center={currentPosition} />{position && <CircleMarker center={currentPosition} radius={10} pathOptions={{ color: '#1764c0', fillColor: '#2f86ff', fillOpacity: .85, weight: 3 }}><Popup>Your current location<br />Accuracy: ±{Math.round(position.accuracy)}m</Popup></CircleMarker>}{puPosition && <CircleMarker center={puPosition} radius={7} pathOptions={{ color: '#087a62', fillColor: '#10b981', fillOpacity: .9, weight: 2 }}><Popup>Approved polling-unit location</Popup></CircleMarker>}</MapContainer><div className="map-caption"><Navigation size={14} />{position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : 'Waiting for device GPS…'}</div></div>
        <div className="location-meta"><div><span>GPS accuracy</span><strong>{position ? `±${Math.round(position.accuracy)}m` : 'Acquiring…'}</strong></div><div><span>Polling unit</span><strong>{puPosition ? 'Coordinate available' : 'Awaiting verification'}</strong></div></div>{gpsError && <p className="gps-error">Location unavailable: {gpsError}</p>}<p className="map-help"><CheckCircle2 size={15} /> The blue marker is your live device position. The green marker is the approved polling-unit coordinate.</p>
      </aside></div>
    </main>
  </div>;
};

const css = `.report-shell{min-height:100vh;background:#f4f7fb;color:#142033;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.report-header{height:70px;background:#071b33;color:#fff;display:flex;align-items:center;padding:0 clamp(18px,5vw,70px);gap:18px}.report-header button{background:transparent;border:0;color:#c7d8ec;display:flex;align-items:center;gap:7px;font-weight:700;cursor:pointer}.report-header>div:nth-child(2){border-left:1px solid #294865;padding-left:18px}.report-header strong,.report-header span{display:block}.report-header strong{font-size:15px}.report-header span{font-size:9px;color:#8ba7c6;letter-spacing:.15em;margin-top:2px}.secure{margin-left:auto;display:flex;gap:7px;align-items:center;color:#80e9b2;font-size:12px;font-weight:700}.report-main{max-width:1240px;margin:auto;padding:42px clamp(18px,5vw,52px) 70px}.eyebrow{font-size:10px;letter-spacing:.13em;font-weight:800;color:#3972b6;margin:0 0 8px}.report-intro h1{font-size:clamp(28px,4vw,40px);letter-spacing:-.045em;margin:0}.report-intro>p:last-child{max-width:660px;color:#64748b;line-height:1.6;margin:9px 0 29px}.report-grid{display:grid;grid-template-columns:1fr .9fr;gap:20px;align-items:start}.incident-form,.location-panel{background:#fff;border:1px solid #dce5f0;border-radius:16px;box-shadow:0 8px 30px #1e3b5a0b}.incident-form{padding:27px}.form-head{display:flex;gap:12px;align-items:center;border-bottom:1px solid #e7edf4;padding-bottom:21px}.form-icon{width:43px;height:43px;display:grid;place-items:center;border-radius:12px;background:#fff0ef;color:#c43240}.form-head h2{font-size:19px;margin:0}.form-head p{font-size:12px;color:#718096;margin:4px 0 0}.incident-form fieldset{border:0;padding:0;margin:23px 0}.incident-form legend,.description-label{display:block;font-size:12px;font-weight:800;color:#40546c;margin-bottom:10px}.category-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.category-grid button{border:1px solid #dbe5f0;background:#fbfcfe;border-radius:9px;padding:12px;text-align:left;color:#40546c;font-size:13px;font-weight:700;display:flex;gap:8px;align-items:center;cursor:pointer}.category-grid button.selected{border-color:#1f70cf;background:#eaf4ff;color:#13519c}.choice-dot{width:9px;height:9px;border:2px solid #95a9c0;border-radius:50%}.selected .choice-dot{border-color:#1764c0;background:#1764c0;box-shadow:inset 0 0 0 2px #eaf4ff}.description-label textarea{margin-top:10px;width:100%;min-height:150px;resize:vertical;border:1px solid #dbe5f0;border-radius:10px;padding:13px;font:inherit;color:#26384f;line-height:1.55;box-sizing:border-box}.description-label textarea:focus{outline:2px solid #b4d7ff;border-color:#2b78d0}.character-count{text-align:right;font-size:11px;color:#94a3b8;margin-top:-5px}.evidence-note{margin:20px 0;display:flex;gap:10px;padding:12px;border-radius:10px;background:#f0f7ff;color:#41607f;font-size:12px;line-height:1.5}.evidence-note svg{color:#216bc1;flex:none}.evidence-note strong{color:#1b3b5e}.submit-report{width:100%;background:#b52f3e;color:#fff;border:0;border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:center;gap:9px;font-weight:800;font-size:14px;cursor:pointer}.submit-report:disabled{background:#b9c3cf;cursor:not-allowed}.submit-report .arrow{transform:rotate(180deg)}.location-panel{overflow:hidden}.location-head{padding:23px 22px 16px;display:flex;gap:10px;justify-content:space-between}.location-head h2{font-size:16px;margin:0;display:flex;gap:6px;align-items:center}.location-head>div>span{font:11px ui-monospace,monospace;color:#6d829b}.gps-pill{height:max-content;margin-top:2px;display:flex;gap:5px;align-items:center;padding:6px 8px;border-radius:20px;background:#fff1d2;color:#9c6500;font-size:10px;font-weight:800}.gps-pill.locked{background:#e4f8ed;color:#147948}.live-map{height:285px;position:relative;border-top:1px solid #e2eaf3;border-bottom:1px solid #e2eaf3}.map-caption{position:absolute;z-index:1000;bottom:10px;left:10px;background:#08203ad9;color:#fff;border-radius:7px;padding:7px 9px;display:flex;align-items:center;gap:6px;font:11px ui-monospace,monospace}.location-meta{padding:17px 22px;display:grid;grid-template-columns:1fr 1fr;gap:12px}.location-meta div+div{border-left:1px solid #e5ebf2;padding-left:12px}.location-meta span,.location-meta strong{display:block}.location-meta span{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#8393a6;font-weight:800}.location-meta strong{font-size:12px;color:#29445f;margin-top:4px}.map-help,.gps-error{margin:0 22px 19px;font-size:11px;line-height:1.5;color:#5d738c;display:flex;gap:6px}.map-help svg{color:#17835a;flex:none}.gps-error{color:#bc3542}.report-loading{min-height:100vh;display:grid;place-content:center;gap:10px;background:#f4f7fb;color:#526b86;font-weight:700}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:820px){.report-grid{grid-template-columns:1fr}.report-main{padding-top:27px}.location-panel{order:-1}.live-map{height:230px}}@media(max-width:520px){.report-header{height:62px;padding:0 15px}.report-header>div:nth-child(2){border:0;padding:0}.secure{font-size:0;padding:8px;background:#123d38;border-radius:20px}.secure svg{margin:0}.report-main{padding:25px 14px 45px}.incident-form{padding:20px}.category-grid{grid-template-columns:1fr}.location-head{padding:18px 17px 13px}.location-meta{padding:15px 17px}.map-help,.gps-error{margin-left:17px;margin-right:17px}}`;
