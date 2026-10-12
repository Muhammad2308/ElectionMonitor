import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncState {
    pendingCount: number;
    failedCount: number;
    lastSyncTime: string | null;
    isOnline: boolean;
    isSyncing: boolean;
    setPendingCount: (count: number) => void;
    setFailedCount: (count: number) => void;
    setLastSyncTime: (time: string) => void;
    setOnline: (status: boolean) => void;
    setSyncing: (status: boolean) => void;
}

export const useSyncStore = create<SyncState>()(
    persist(
        (set) => ({
            pendingCount: 0,
            failedCount: 0,
            lastSyncTime: null,
            isOnline: navigator.onLine,
            isSyncing: false,
            setPendingCount: (count) => set({ pendingCount: count }),
            setFailedCount: (count) => set({ failedCount: count }),
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
            setOnline: (status) => set({ isOnline: status }),
            setSyncing: (status) => set({ isSyncing: status }),
        }),
        { name: 'eip-sync-store' }
    )
);

// Auto-detect online/offline
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => useSyncStore.getState().setOnline(true));
    window.addEventListener('offline', () => useSyncStore.getState().setOnline(false));
}
