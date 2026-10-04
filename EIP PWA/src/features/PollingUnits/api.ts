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
}

export interface GeoWard {
  id: number;
  name: string;
  lga_id: number;
}

export const pollingUnitSubmissionsAPI = {
  // The client defaults to JSON, which would serialise FormData as JSON and drop the files.
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
  pollingUnits: (): Promise<{ data: GeoPollingUnit[] }> => api.get('/geography/polling-units'),
  wards: (): Promise<GeoWard[]> => api.get('/geography/wards'),
};
