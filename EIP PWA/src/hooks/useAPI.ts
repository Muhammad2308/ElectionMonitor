import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

interface UseAPIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAPIReturn<T> extends UseAPIState<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

/**
 * Generic hook for making API calls
 */
export const useAPI = <T,>(
  apiFunction: (...args: any[]) => Promise<T>,
  autoFetch: boolean = true
): UseAPIReturn<T> => {
  const [state, setState] = useState<UseAPIState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'An error occurred';
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
};

/**
 * Hook for paginated data fetching
 */
export const usePaginatedAPI = <T,>(
  apiFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 20
) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(pageNum, pageSize);
      setData(result.data);
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [apiFunction, pageSize]);

  return {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    goToPage: fetchPage,
    nextPage: () => fetchPage(page + 1),
    prevPage: () => fetchPage(Math.max(1, page - 1)),
    hasNextPage: page * pageSize < total,
    hasPrevPage: page > 1,
  };
};
