import { landmarkApi } from '@/apis/landmark/landmarkApi';
import useToast from '@/hooks/component/useToast';
import type { LandmarkCard } from '@/types/api/landmarkTypes';
import { useCallback, useEffect, useState } from 'react';

export const useFeaturedLandmarks = () => {
  const [landmarks, setLandmarks] = useState<LandmarkCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showError } = useToast();

  const fetchLandmarks = useCallback(async () => {
    try {
      const data = await landmarkApi.getFeaturedLandmarks();
      setLandmarks(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load monument list.';
      setError(msg);
      showError('Data Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
  };
};

export default useFeaturedLandmarks;
