import { useCallback, useEffect, useState } from 'react';
import api from '../../api';
import { db, type ObserverAssignment } from '../../storage/db';
import { useAuthStore } from '../../store/useAuthStore';

interface AssignmentResponse {
  data: Omit<ObserverAssignment, 'cached_at'>[];
}

async function loadCachedAssignment(userId: number) {
  return db.assignments.where('user_id').equals(userId).reverse().sortBy('cached_at').then((rows) => rows[0]);
}

export function useMyAssignment() {
  const userId = useAuthStore((state) => state.user?.id);
  const [assignment, setAssignment] = useState<ObserverAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineCopy, setIsOfflineCopy] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setAssignment(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const response = await api.get<AssignmentResponse>('/assignments/mine');
      const latest = response.data[0];
      if (!latest) {
        setAssignment(null);
        setIsOfflineCopy(false);
        return;
      }

      const cached = { ...latest, cached_at: new Date().toISOString() };
      await db.assignments.put(cached);
      setAssignment(cached);
      setIsOfflineCopy(false);
    } catch {
      const cached = await loadCachedAssignment(userId);
      setAssignment(cached ?? null);
      setIsOfflineCopy(Boolean(cached));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { assignment, isLoading, isOfflineCopy, refresh };
}
