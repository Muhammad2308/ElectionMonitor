import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '../../components/Layout/AdminLayout';
import { gisAPI } from './api';

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#9ca3af',
};

const NIGERIA_CENTER: [number, number] = [9.05, 7.49];

export const MapView: React.FC = () => {
  const [layers, setLayers] = useState({ pollingUnits: true, observers: true, incidents: true });

  const pollingUnits = useQuery({ queryKey: ['gis', 'polling-units'], queryFn: gisAPI.pollingUnits, refetchInterval: 60_000 });
  const observers = useQuery({ queryKey: ['gis', 'observers'], queryFn: gisAPI.observers, refetchInterval: 15_000 });
  const incidents = useQuery({ queryKey: ['gis', 'incidents'], queryFn: gisAPI.incidents, refetchInterval: 15_000 });

  const toggle = (key: keyof typeof layers) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Live Map
              <span className="text-xs px-2 py-1 rounded bg-green-600 text-green-100 align-middle">LIVE</span>
            </h2>
            <p className="text-gray-400 text-sm">Polling units, observer positions, and open incidents.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <LayerToggle label={`Polling Units (${pollingUnits.data?.data.length ?? 0})`} active={layers.pollingUnits} onClick={() => toggle('pollingUnits')} color="#3b82f6" />
            <LayerToggle label={`Observers (${observers.data?.data.length ?? 0})`} active={layers.observers} onClick={() => toggle('observers')} color="#10b981" />
            <LayerToggle label={`Incidents (${incidents.data?.data.length ?? 0})`} active={layers.incidents} onClick={() => toggle('incidents')} color="#ef4444" />
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-gray-700" style={{ height: 'calc(100vh - 260px)', minHeight: 420 }}>
          <MapContainer center={NIGERIA_CENTER} zoom={13} style={{ height: '100%', width: '100%', background: '#111827' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {layers.pollingUnits && pollingUnits.data?.data.map((pu) => (
              <CircleMarker
                key={`pu-${pu.id}`}
                center={[pu.latitude, pu.longitude]}
                radius={5}
                pathOptions={{
                  color: pu.has_coverage ? '#3b82f6' : '#6b7280',
                  fillColor: pu.has_coverage ? '#3b82f6' : '#6b7280',
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{pu.name}</strong><br />
                    {pu.ward}, {pu.lga}, {pu.state}<br />
                    {pu.has_coverage ? 'Observer checked in' : 'No observer check-in yet'}<br />
                    {pu.open_incidents} open incident{pu.open_incidents === 1 ? '' : 's'}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {layers.observers && observers.data?.data.map((obs) => obs.latitude && obs.longitude && (
              <CircleMarker
                key={`obs-${obs.id}`}
                center={[obs.latitude, obs.longitude]}
                radius={7}
                pathOptions={{
                  color: obs.is_online ? '#10b981' : '#6b7280',
                  fillColor: obs.is_online ? '#10b981' : '#6b7280',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{obs.name}</strong><br />
                    {obs.polling_unit ?? 'Unassigned'}<br />
                    {obs.is_online ? 'Online' : 'Last seen a while ago'}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {layers.incidents && incidents.data?.data.map((inc) => (
              <CircleMarker
                key={`inc-${inc.id}`}
                center={[inc.latitude, inc.longitude]}
                radius={9}
                pathOptions={{
                  color: severityColor[inc.severity] ?? '#ef4444',
                  fillColor: severityColor[inc.severity] ?? '#ef4444',
                  fillOpacity: 0.5,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{inc.category}</strong><br />
                    {inc.polling_unit}<br />
                    Severity: {inc.severity} · Status: {inc.status}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </AdminLayout>
  );
};

const LayerToggle: React.FC<{ label: string; active: boolean; onClick: () => void; color: string }> = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
      active ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-800 bg-gray-900 text-gray-500'
    }`}
  >
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: active ? color : '#4b5563' }} />
    {label}
  </button>
);

export default MapView;
