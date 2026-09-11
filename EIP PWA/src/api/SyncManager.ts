import { db, type QueuedAction } from '../storage/db';
import api from '../api';

class SyncManager {
    private isProcessing = false;
    private retryLimits = [30000, 120000, 600000, 3600000]; // 30s, 2m, 10m, 1h

    public async init() {
        // Start the sync loop
        setInterval(() => this.processQueue(), 15000);
        this.processQueue();
    }

    public async queueAction(type: QueuedAction['type'], payload: any, priority = 1) {
        const action: QueuedAction = {
            id: crypto.randomUUID(),
            type,
            payload,
            status: 'pending',
            priority,
            retry_count: 0,
            created_at: new Date().toISOString(),
        };
        await db.queued_actions.add(action);
        this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing || !navigator.onLine) return;
        this.isProcessing = true;

        try {
            const actions = await db.queued_actions
                .where('status')
                .anyOf(['pending', 'failed'])
                .sortBy('priority');

            for (const action of actions) {
                // If failed, check if we should retry based on exponential backoff
                if (action.status === 'failed') {
                    const lastRetryTime = new Date(action.created_at).getTime(); // Simplified for prototype
                    const waitTime = this.retryLimits[Math.min(action.retry_count, this.retryLimits.length - 1)];
                    if (Date.now() - lastRetryTime < waitTime) continue;
                }

                await this.executeAction(action);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private async executeAction(action: QueuedAction) {
        await db.queued_actions.update(action.id, { status: 'syncing' });

        try {
            let endpoint = '';
            let method: 'post' | 'put' | 'patch' = 'post';
            let payload = action.payload;

            switch (action.type) {
                case 'CREATE_INCIDENT':
                    endpoint = '/incidents/report';
                    break;
                case 'UPLOAD_MEDIA':
                    endpoint = '/incidents/media';
                    const formData = new FormData();
                    Object.keys(payload).forEach(key => formData.append(key, payload[key]));
                    payload = formData;
                    break;
                case 'CHECK_IN':
                    endpoint = '/observers/check-in';
                    break;
                case 'LOCATION_UPDATE':
                    endpoint = '/observers/location';
                    break;
            }

            await api[method](endpoint, payload);
            await db.queued_actions.update(action.id, { status: 'synced' });
        } catch (error: any) {
            const isConflict = error.response?.status === 409;
            await db.queued_actions.update(action.id, {
                status: isConflict ? 'conflict' : 'failed',
                retry_count: action.retry_count + 1,
                last_error: error.message,
            });
        }
    }
}

export const syncManager = new SyncManager();
syncManager.init();
