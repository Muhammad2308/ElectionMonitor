import { useEffect } from 'react';
import { db } from '../../storage/db';
import api from '../../api';

export const useSyncQueue = () => {
    useEffect(() => {
        const syncInterval = setInterval(async () => {
            if (!navigator.onLine) return;

            // 1. Sync Pending Incidents
            const pendingIncidents = await db.incidents.where('sync_status').equals('pending').toArray();

            for (const incident of pendingIncidents) {
                try {
                    await api.post('/incidents/report', incident);
                    await db.incidents.update(incident.id, { sync_status: 'synced' });
                    console.log(`Incident ${incident.id} synced successfully`);
                } catch (error) {
                    console.error(`Failed to sync incident ${incident.id}`, error);
                    await db.incidents.update(incident.id, { sync_status: 'failed' });
                }
            }

            // 2. Sync Pending Media
            const pendingMedia = await db.media.where('sync_status').equals('pending').toArray();

            for (const media of pendingMedia) {
                try {
                    const formData = new FormData();
                    formData.append('incident_id', media.incident_id);
                    formData.append('file', media.file_blob);
                    formData.append('type', media.media_type);

                    await api.post('/incidents/media', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    await db.media.update(media.id, { sync_status: 'synced' });
                    console.log(`Media ${media.id} synced successfully`);
                } catch (error) {
                    console.error(`Failed to sync media ${media.id}`, error);
                }
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(syncInterval);
    }, []);
};
