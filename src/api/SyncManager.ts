import { db, type QueuedAction } from '../storage/db';
import api from '../api';
import { useSyncStore } from '../store/useSyncStore';
import axios from 'axios';

class SyncManager {
    private isProcessing = false;
    private retryLimits = [30000, 120000, 600000, 3600000]; // 30s, 2m, 10m, 1h

    public init() {
        window.addEventListener('online', () => void this.processQueue());
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') void this.processQueue();
        });
        window.setInterval(() => void this.processQueue(), 15_000);
        void this.refreshStatus();
        void this.processQueue();
    }

    public async queueAction(
        type: QueuedAction['type'],
        payload: Record<string, unknown>,
        priority = 100,
        dependsOnIncidentId?: string,
    ) {
        const action: QueuedAction = {
            id: crypto.randomUUID(),
            type,
            payload,
            status: 'pending',
            priority,
            retry_count: 0,
            created_at: new Date().toISOString(),
            depends_on_incident_id: dependsOnIncidentId,
        };
        await db.queued_actions.add(action);
        await this.refreshStatus();
        void this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing || !navigator.onLine) return;
        this.isProcessing = true;
        useSyncStore.getState().setSyncing(true);

        try {
            const actions = await db.queued_actions
                .where('status')
                .anyOf(['pending', 'failed'])
                .sortBy('priority');

            for (const action of actions) {
                if (action.depends_on_incident_id) {
                    const incident = await db.incidents.get(action.depends_on_incident_id);
                    if (!incident || incident.sync_status !== 'synced') continue;
                }

                // If failed, check if we should retry based on exponential backoff
                if (action.status === 'failed') {
                    const lastRetryTime = new Date(action.last_attempt_at ?? action.created_at).getTime();
                    const waitTime = this.retryLimits[Math.min(action.retry_count, this.retryLimits.length - 1)];
                    if (Date.now() - lastRetryTime < waitTime) continue;
                }

                await this.executeAction(action);
            }
        } finally {
            this.isProcessing = false;
            useSyncStore.getState().setSyncing(false);
            await this.refreshStatus();
        }
    }

    private async executeAction(action: QueuedAction) {
        await db.queued_actions.update(action.id, {
            status: 'syncing',
            last_attempt_at: new Date().toISOString(),
        });

        try {
            let endpoint = '';
            const method: 'post' | 'put' | 'patch' = 'post';
            let payload: Record<string, unknown> | FormData = action.payload;

            switch (action.type) {
                case 'CREATE_INCIDENT':
                    endpoint = '/incidents/report';
                    break;
                case 'UPLOAD_MEDIA': {
                    endpoint = '/incidents/media';
                    const formData = new FormData();
                    Object.entries(action.payload).forEach(([key, value]) => {
                        if (value instanceof Blob) formData.append(key, value);
                        else if (value !== undefined && value !== null) formData.append(key, String(value));
                    });
                    payload = formData;
                    break;
                }
                case 'CHECK_IN':
                    endpoint = '/observers/check-in';
                    break;
                case 'LOCATION_UPDATE':
                    endpoint = '/observers/location';
                    break;
                case 'POLLING_UNIT_SUBMISSION': {
                    endpoint = '/polling-units/submissions';
                    const formData = new FormData();
                    Object.entries(action.payload).forEach(([key, value]) => {
                        if (key === 'photos' && Array.isArray(value)) {
                            value.forEach((photo: unknown) => {
                                if (photo instanceof Blob) {
                                    const filename = photo instanceof File ? photo.name : 'evidence.jpg';
                                    formData.append('photos[]', photo, filename);
                                }
                            });
                        } else if (value instanceof Blob) {
                            formData.append(key, value);
                        } else if (value !== undefined && value !== null) {
                            formData.append(key, String(value));
                        }
                    });
                    payload = formData;
                    break;
                }
            }

            await api[method](endpoint, payload);
            await db.queued_actions.update(action.id, { status: 'synced' });
            await this.markEntitySynced(action);
        } catch (error: unknown) {
            const isConflict = axios.isAxiosError(error) && error.response?.status === 409;
            await db.queued_actions.update(action.id, {
                status: isConflict ? 'conflict' : 'failed',
                retry_count: action.retry_count + 1,
                last_error: error instanceof Error ? error.message : 'Unexpected synchronization error.',
            });
        }
    }

    private async markEntitySynced(action: QueuedAction) {
        if (action.type === 'CREATE_INCIDENT' && typeof action.payload.id === 'string') {
            await db.incidents.update(action.payload.id, { sync_status: 'synced' });
        }
        if (action.type === 'UPLOAD_MEDIA' && typeof action.payload.id === 'string') {
            await db.media.update(action.payload.id, { sync_status: 'synced' });
        }
    }

    private async refreshStatus() {
        const [pendingCount, failedCount] = await Promise.all([
            db.queued_actions.where('status').anyOf(['pending', 'syncing']).count(),
            db.queued_actions.where('status').equals('failed').count(),
        ]);
        useSyncStore.getState().setPendingCount(pendingCount);
        useSyncStore.getState().setFailedCount(failedCount);
        if (pendingCount === 0 && failedCount === 0) {
            useSyncStore.getState().setLastSyncTime(new Date().toISOString());
        }
    }
}

export const syncManager = new SyncManager();
syncManager.init();
