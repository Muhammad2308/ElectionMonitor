import api from '../../api';

export type SubmissionType = 'coordinates' | 'new_polling_unit';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface PollingUnitSubmission {
  id: number;
  uuid: string;
  submission_type: SubmissionType;
  status: SubmissionStatus;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  distance_from_existing_m: number | null;
  captured_at: string;
  proposed_name: string | null;
  polling_unit_id: number | null;
  polling_unit?: {
    id: number;
    pu_code: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    is_registered?: boolean;
    image_url?: string | null;
  };
  ward?: { id: number; name: string; lga_name: string | null };
  submitter?: {
    id: number;
    name: string;
    email: string;
    user_code: string | null;
    role_type: string | null;
  };
  photos?: { id: number; mime_type: string; size_bytes: number; url: string }[];
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface GeoPollingUnit {
  id: number;
  ward_id: number;
  pu_code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_registered: boolean;
  registered_at: string | null;
  registered_by?: { id: number; name: string } | null;
  ward_name?: string;
  lga_name?: string;
  lga_id?: number;
}

export interface GeoLga {
  id: number;
  name: string;
  state_id: number;
}

export interface GeoWard {
  id: number;
  name: string;
  lga_id: number;
}

export interface PollingUnitStats {
  total: number;
  registered: number;
  unregistered: number;
  registered_pct: number;
  pending_submissions: number;
}

export interface PollingUnitQueryParams {
  lga_id?: number;
  ward_id?: number;
  is_registered?: string;
  search?: string;
  page?: number;
  per_page?: number;
  all?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const pollingUnitSubmissionsAPI = {
  submit: (form: FormData): Promise<{ data: PollingUnitSubmission }> =>
    api.post('/polling-units/submissions', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  photoBlob: (url: string): Promise<Blob> => api.get(url, { responseType: 'blob' }),
  mine: (): Promise<{ data: PollingUnitSubmission[] }> =>
    api.get('/polling-units/submissions/mine'),
  list: (status: SubmissionStatus): Promise<{ data: PollingUnitSubmission[] }> =>
    api.get('/polling-units/submissions', { params: { status } }),
  approve: (id: number, body: { pu_code?: string; name?: string }): Promise<{ data: PollingUnitSubmission }> =>
    api.post(`/polling-units/submissions/${id}/approve`, body),
  reject: (id: number, review_note: string): Promise<{ data: PollingUnitSubmission }> =>
    api.post(`/polling-units/submissions/${id}/reject`, { review_note }),
};

export const geographyAPI = {
  stats: (): Promise<PollingUnitStats> =>
    api.get('/geography/polling-units/stats'),
  lgas: (): Promise<GeoLga[]> =>
    api.get('/geography/lgas'),
  wards: (lgaId?: number): Promise<GeoWard[]> =>
    api.get('/geography/wards', { params: lgaId ? { lga_id: lgaId } : undefined }),
  pollingUnits: (params?: PollingUnitQueryParams): Promise<PaginatedResponse<GeoPollingUnit>> =>
    api.get('/geography/polling-units', { params }),
  register: (id: number, form: FormData): Promise<{ message: string; polling_unit: GeoPollingUnit }> =>
    api.post(`/geography/polling-units/${id}/register`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
