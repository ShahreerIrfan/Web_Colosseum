import { viewpointApi } from '@/apis/viewpoint/viewpointApi';
import useToast from '@/hooks/component/useToast';
import type {
  CreateViewpointInput,
  UpdateViewpointInput,
  ViewpointModel,
} from '@/types/api/viewpointTypes';
import { useCallback, useEffect, useState } from 'react';

export const useViewpoints = (initialFloorId?: string) => {
  const [viewpoints, setViewpoints] = useState<ViewpointModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchViewpoints = useCallback(
    async (floorId?: string) => {
      try {
        setLoading(true);
        setError(null);
        const data = await viewpointApi.getAll(floorId ?? initialFloorId);
        setViewpoints(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch viewpoints.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [initialFloorId]
  );

  useEffect(() => {
    fetchViewpoints();
  }, [fetchViewpoints]);

  const createViewpoint = async (input: CreateViewpointInput): Promise<ViewpointModel> => {
    try {
      const created = await viewpointApi.create(input);
      setViewpoints((prev) => [created, ...prev.filter((v) => v.id !== created.id)]);
      showSuccess('Viewpoint Created', `"${created.title}" registered successfully.`);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register viewpoint.';
      showError('Creation Error', msg);
      throw err;
    }
  };

  const updateViewpoint = async (
    id: string,
    input: UpdateViewpointInput
  ): Promise<ViewpointModel> => {
    try {
      const updated = await viewpointApi.update(id, input);
      setViewpoints((prev) => prev.map((vp) => (vp.id === id ? updated : vp)));
      showSuccess('Viewpoint Updated', `"${updated.title}" updated successfully.`);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update viewpoint.';
      showError('Update Error', msg);
      throw err;
    }
  };

  const deleteViewpoint = async (id: string): Promise<void> => {
    try {
      await viewpointApi.delete(id);
      setViewpoints((prev) => prev.filter((vp) => vp.id !== id));
      showSuccess('Viewpoint Deleted', `Viewpoint ${id} has been removed.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete viewpoint.';
      showError('Deletion Error', msg);
      throw err;
    }
  };

  return {
    viewpoints,
    loading,
    error,
    refresh: fetchViewpoints,
    createViewpoint,
    updateViewpoint,
    deleteViewpoint,
  };
};

export default useViewpoints;
