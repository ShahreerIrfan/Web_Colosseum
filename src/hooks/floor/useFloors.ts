import { floorApi } from '@/apis/floor/floorApi';
import type { CreateFloorInput, FloorModel, UpdateFloorInput } from '@/types/api/floorTypes';
import { useCallback, useEffect, useState } from 'react';

export const useFloors = (landmarkCode?: string) => {
  const [floors, setFloors] = useState<FloorModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFloors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await floorApi.getAll(landmarkCode);
      setFloors(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch floor maps.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [landmarkCode]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  const createFloor = useCallback(async (payload: CreateFloorInput): Promise<FloorModel> => {
    const created = await floorApi.create(payload);
    setFloors((prev) => [created, ...prev.filter((f) => f.floorId !== created.floorId)]);
    return created;
  }, []);

  const updateFloor = useCallback(
    async (id: string, payload: UpdateFloorInput): Promise<FloorModel> => {
      const updated = await floorApi.update(id, payload);
      setFloors((prev) => prev.map((f) => (f.id === id || f.floorId === id ? updated : f)));
      return updated;
    },
    []
  );

  const deleteFloor = useCallback(async (id: string): Promise<boolean> => {
    const success = await floorApi.delete(id);
    if (success) {
      setFloors((prev) => prev.filter((f) => f.id !== id && f.floorId !== id));
    }
    return success;
  }, []);

  return {
    floors,
    setFloors,
    isLoading,
    error,
    refresh: fetchFloors,
    createFloor,
    updateFloor,
    deleteFloor,
  };
};

export default useFloors;
