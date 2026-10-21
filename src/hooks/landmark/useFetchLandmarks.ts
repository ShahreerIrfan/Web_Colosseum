import { landmarkApi } from '@/apis/landmark/landmarkApi';
import useToast from '@/hooks/component/useToast';
import type { PaginationParams } from '@/types/api/CommonTypes';
import type { Landmark } from '@/types/api/landmarkTypes';
import { useCallback, useEffect, useState } from 'react';

export const useFetchLandmarks = (initialParams?: PaginationParams) => {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginationParams | undefined>(initialParams);

  const { showError } = useToast();

  const fetchLandmarks = useCallback(async () => {
    try {
      const data = await landmarkApi.getAll(params);
      setLandmarks(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load monument list.';
      setError(msg);
      showError('Data Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [params, showError]);

  useEffect(() => {
    fetchLandmarks();
  }, [fetchLandmarks]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchLandmarks();
  }, [fetchLandmarks]);

  return {
    landmarks,
    loading,
    error,
    refresh: handleRefresh,
    setParams,
  };
};
