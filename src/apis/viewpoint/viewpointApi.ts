import api from '@/apis/axios';
import { isAxiosError } from 'axios';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import type {
  CreateViewpointInput,
  UpdateViewpointInput,
  ViewpointModel,
} from '@/types/api/viewpointTypes';
import { ENDPOINTS } from '@/utils/endPoints';

function requireData<T>(response: BaseSuccessResponse<T> & { payload?: T }): T {
  const data = response.data ?? response.payload;
  if (data == null) throw new Error('The server did not return Viewpoint data.');
  return data;
}

async function saveViewpoint(request: Promise<{ data: BaseSuccessResponse<ViewpointModel> }>) {
  try {
    return requireData((await request).data);
  } catch (error) {
    if (isAxiosError<{ message?: string }>(error) && error.response?.data.message) {
      throw new Error(error.response.data.message, { cause: error });
    }
    throw error;
  }
}

export const viewpointApi = {
  getAll: async (floorId?: string): Promise<ViewpointModel[]> => {
    const limit = 100;
    const viewpoints = new Map<string, ViewpointModel>();
    for (let page = 1; ; page++) {
      const { data } = await api.get<BaseSuccessResponse<ViewpointModel[]>>(
        ENDPOINTS.VIEWPOINTS.LIST,
        { params: { floorId, page, limit } }
      );
      const batch = requireData(data);
      const previousSize = viewpoints.size;
      for (const viewpoint of batch) viewpoints.set(viewpoint.id, viewpoint);
      if (batch.length < limit) return [...viewpoints.values()];
      if (viewpoints.size === previousSize)
        throw new Error('Viewpoint pagination did not advance.');
    }
  },

  getById: async (id: string): Promise<ViewpointModel> => {
    const { data } = await api.get<BaseSuccessResponse<ViewpointModel>>(
      ENDPOINTS.VIEWPOINTS.GET_BY_ID(id)
    );
    return requireData(data);
  },

  create: (payload: CreateViewpointInput): Promise<ViewpointModel> =>
    saveViewpoint(api.post(ENDPOINTS.VIEWPOINTS.CREATE, payload)),

  update: (id: string, payload: UpdateViewpointInput): Promise<ViewpointModel> =>
    saveViewpoint(api.patch(ENDPOINTS.VIEWPOINTS.UPDATE(id), payload)),

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.VIEWPOINTS.DELETE(id));
  },
};
