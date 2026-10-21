import { landmarkApi } from '@/apis/landmark/landmarkApi';
import useToast from '@/hooks/component/useToast';
import type { FloorLevel, Landmark, Viewpoint } from '@/types/api/landmarkTypes';
import { useCallback, useEffect, useState } from 'react';

export const useLandmarkDetails = (id: string | undefined) => {
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [floors, setFloors] = useState<FloorLevel[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>('');
  const [viewpoints, setViewpoints] = useState<Viewpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showError } = useToast();

  const fetchDetails = useCallback(
    async (isManualRefresh = false) => {
      if (!id) return;
      if (isManualRefresh) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await landmarkApi.getById(id);
        setLandmark(data);
        const floorList = data.floors || (await landmarkApi.getFloors(data.code));
        setFloors(floorList);
        if (floorList.length > 0 && !activeFloorId) {
          setActiveFloorId(floorList[0].floorId);
        }
        setViewpoints(data.viewpoints || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Monument information could not be found.';
        setError(msg);
        showError('Error', msg);
      } finally {
        setLoading(false);
      }
    },
    [id, activeFloorId, showError]
  );

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    landmark,
    floors,
    activeFloorId,
    setActiveFloorId,
    viewpoints: viewpoints.filter((vp) => !activeFloorId || vp.floorId === activeFloorId),
    loading,
    error,
    refresh: () => fetchDetails(true),
  };
};
