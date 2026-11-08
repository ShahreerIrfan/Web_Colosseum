import api from '@/apis/axios';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import type {
  CreateViewpointInput,
  UpdateViewpointInput,
  ViewpointModel,
} from '@/types/api/viewpointTypes';
import { ENDPOINTS } from '@/utils/endPoints';

const MOCK_VIEWPOINTS: ViewpointModel[] = [
  {
    id: 'vp_100',
    floorId: 'floor_underground',
    title: 'Spectacles in the Colosseum Arena Floor. The Superstars',
    order: 100,
    normalizedX: 0.8,
    normalizedY: 0.5,
    latitude: 41.89025,
    longitude: 12.49282,
    imageAsset: 'assets/images/vp_100_arena_spectacles.jpg',
    audioUrl: '',
    audioDuration: '3 min',
    isVisited: false,
    triggerRadiusMeters: 4.0,
    targetGazeHeadingDegrees: 180,
    isPublished: true,
  },
  {
    id: 'vp_101',
    floorId: 'floor_underground',
    title: 'Ludus Magnus Subterranean Corridor Entrance',
    order: 101,
    normalizedX: 0.25,
    normalizedY: 0.45,
    latitude: 41.89018,
    longitude: 12.49215,
    imageAsset: 'assets/images/vp_101_ludus_magnus_tunnel.jpg',
    audioUrl: '',
    audioDuration: '2.5 min',
    isVisited: false,
    triggerRadiusMeters: 4.0,
    targetGazeHeadingDegrees: 90,
    isPublished: true,
  },
];

export const viewpointApi = {
  getAll: async (floorId?: string): Promise<ViewpointModel[]> => {
    try {
      const url = floorId
        ? `${ENDPOINTS.VIEWPOINTS.LIST}?floorId=${encodeURIComponent(floorId)}`
        : ENDPOINTS.VIEWPOINTS.LIST;
      const res = await api.get<BaseSuccessResponse<ViewpointModel[]>>(url);
      const data = res.data.data || (res.data as unknown as { payload: ViewpointModel[] }).payload;
      return Array.isArray(data) ? data : MOCK_VIEWPOINTS;
    } catch {
      return floorId ? MOCK_VIEWPOINTS.filter((vp) => vp.floorId === floorId) : MOCK_VIEWPOINTS;
    }
  },

  getById: async (id: string): Promise<ViewpointModel> => {
    try {
      const res = await api.get<BaseSuccessResponse<ViewpointModel>>(
        ENDPOINTS.VIEWPOINTS.GET_BY_ID(id)
      );
      const data = res.data.data || (res.data as unknown as { payload: ViewpointModel }).payload;
      return data;
    } catch {
      const found = MOCK_VIEWPOINTS.find((vp) => vp.id === id);
      if (found) return found;
      throw new Error(`Viewpoint with id '${id}' not found`);
    }
  },

  create: async (payload: CreateViewpointInput): Promise<ViewpointModel> => {
    try {
      const res = await api.post<BaseSuccessResponse<ViewpointModel>>(
        ENDPOINTS.VIEWPOINTS.CREATE,
        payload
      );
      const created = res.data.data || (res.data as unknown as { payload: ViewpointModel }).payload;
      return created;
    } catch {
      const mock: ViewpointModel = {
        ...payload,
        normalizedX: payload.normalizedX ?? 0.5,
        normalizedY: payload.normalizedY ?? 0.5,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_VIEWPOINTS.unshift(mock);
      return mock;
    }
  },

  update: async (id: string, payload: UpdateViewpointInput): Promise<ViewpointModel> => {
    try {
      const res = await api.patch<BaseSuccessResponse<ViewpointModel>>(
        ENDPOINTS.VIEWPOINTS.UPDATE(id),
        payload
      );
      const updated = res.data.data || (res.data as unknown as { payload: ViewpointModel }).payload;
      return updated;
    } catch {
      const idx = MOCK_VIEWPOINTS.findIndex((vp) => vp.id === id);
      if (idx !== -1) {
        MOCK_VIEWPOINTS[idx] = {
          ...MOCK_VIEWPOINTS[idx],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        return MOCK_VIEWPOINTS[idx];
      }
      throw new Error(`Viewpoint with id '${id}' not found to update`);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(ENDPOINTS.VIEWPOINTS.DELETE(id));
    } catch {
      const idx = MOCK_VIEWPOINTS.findIndex((vp) => vp.id === id);
      if (idx !== -1) {
        MOCK_VIEWPOINTS.splice(idx, 1);
      }
    }
  },
};
