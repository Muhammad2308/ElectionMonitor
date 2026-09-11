import Dexie, { type Table } from 'dexie';

export interface State {
  id: number;
  name: string;
  iso_code: string | null;
}

export interface LGA {
  id: number;
  state_id: number;
  name: string;
}

export interface Ward {
  id: number;
  lga_id: number;
  name: string;
}

export interface PollingUnit {
  id: number;
  ward_id: number;
  pu_code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Incident {
  id: string; // UUID
  user_id: number;
  polling_unit_id: number;
  category_id: number;
  description: string;
  incident_time: string;
  latitude: number | null;
  longitude: number | null;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface IncidentMedia {
  id: string; // UUID
  incident_id: string;
  media_type: 'image' | 'audio' | 'video';
  file_blob: Blob;
  file_hash: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface QueuedAction {
  id: string; // UUID
  type: 'CREATE_INCIDENT' | 'UPLOAD_MEDIA' | 'CHECK_IN' | 'LOCATION_UPDATE';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  priority: number;
  retry_count: number;
  last_error?: string;
  created_at: string;
}

export class EIPDatabase extends Dexie {
  states!: Table<State>;
  lgas!: Table<LGA>;
  wards!: Table<Ward>;
  polling_units!: Table<PollingUnit>;
  incidents!: Table<Incident>;
  media!: Table<IncidentMedia>;
  queued_actions!: Table<QueuedAction>;

  constructor() {
    super('EIPDatabase');
    this.version(2).stores({
      states: 'id, name',
      lgas: 'id, state_id, name',
      wards: 'id, lga_id, name',
      polling_units: 'id, ward_id, pu_code, name',
      incidents: 'id, user_id, polling_unit_id, category_id, sync_status, created_at',
      media: 'id, incident_id, sync_status',
      queued_actions: 'id, type, status, priority, created_at',
    });
  }
}

export const db = new EIPDatabase();
