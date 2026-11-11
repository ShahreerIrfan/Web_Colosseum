import api from '@/apis/axios';
import { isAxiosError } from 'axios';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import type { CreateFloorInput, FloorModel, UpdateFloorInput } from '@/types/api/floorTypes';
import { ENDPOINTS } from '@/utils/endPoints';

interface BackendFloorRaw {
  id?: string;
  _id?: string;
  floorId?: string;
  landmarkCode?: string;
  levelIndex?: number;
  levelNumber?: number;
  displayName?: string;
  floorName?: string;
  name?: string;
  shortName?: string;
  floorNumberLabel?: string;
  semanticLabel?: string;
  calibration?: {
    centerCoordinates?: { latitude: number; longitude: number };
    defaultZoom?: number;
    mapNorthOffsetDegrees?: number;
  };
  mapAsset?: {
    assetId?: string;
    url?: string;
    cloudinaryPublicId?: string;
  };
  isAccessibleForTier?: string[];
  isPublished?: boolean;
  viewpointCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const mapRawFloor = (raw: BackendFloorRaw): FloorModel => {
  const floorId = raw.floorId || raw.id || raw._id || 'floor_unknown';

  return {
    id: raw.id || raw._id || floorId,
    floorId,
    landmarkCode: raw.landmarkCode || 'colosseum',
    levelIndex: raw.levelIndex ?? raw.levelNumber ?? 1,
    displayName: raw.displayName || raw.floorName || raw.name || 'Floor Map',
    shortName: raw.shortName || raw.floorName || 'Floor',
    floorNumberLabel: raw.floorNumberLabel || `Floor ${raw.levelIndex ?? 1}`,
    semanticLabel: raw.semanticLabel || '',
    calibration: {
      centerCoordinates: {
        latitude: raw.calibration?.centerCoordinates?.latitude ?? 41.89021,
        longitude: raw.calibration?.centerCoordinates?.longitude ?? 12.492231,
      },
      defaultZoom: raw.calibration?.defaultZoom ?? 18.6,
      mapNorthOffsetDegrees: raw.calibration?.mapNorthOffsetDegrees ?? -20.0,
    },
    mapAsset: {
      assetId: raw.mapAsset?.assetId || `${floorId}_map`,
      url: raw.mapAsset?.url || '',
      cloudinaryPublicId: raw.mapAsset?.cloudinaryPublicId || '',
    },
    isAccessibleForTier: raw.isAccessibleForTier || ['general', 'arena_priority', 'full_access'],
    isPublished: raw.isPublished ?? true,
    viewpointCount: raw.viewpointCount ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const saveFloor = async (request: Promise<{ data: BaseSuccessResponse<BackendFloorRaw> }>) => {
  try {
    const response = await request;
    return mapRawFloor(response.data.data);
  } catch (error) {
    if (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message, { cause: error });
    }
    throw error;
  }
};

export const floorApi = {
  getAll: async (landmarkCode?: string): Promise<FloorModel[]> => {
    const endpoint = landmarkCode
      ? `${ENDPOINTS.FLOORS.LIST}?landmark=${encodeURIComponent(landmarkCode)}`
      : ENDPOINTS.FLOORS.LIST;
    const { data } =
      await api.get<BaseSuccessResponse<BackendFloorRaw[] | { floors: BackendFloorRaw[] }>>(
        endpoint
      );
    return (Array.isArray(data.data) ? data.data : data.data.floors).map(mapRawFloor);
  },

  getById: async (id: string): Promise<FloorModel> => {
    const { data } = await api.get<BaseSuccessResponse<BackendFloorRaw>>(
      ENDPOINTS.FLOORS.GET_BY_ID(id)
    );
    return mapRawFloor(data.data);
  },

  create: (payload: CreateFloorInput) =>
    saveFloor(api.post<BaseSuccessResponse<BackendFloorRaw>>(ENDPOINTS.FLOORS.CREATE, payload)),

  update: (id: string, payload: UpdateFloorInput) =>
    saveFloor(
      api.patch<BaseSuccessResponse<BackendFloorRaw>>(ENDPOINTS.FLOORS.UPDATE(id), payload)
    ),

  delete: async (id: string): Promise<boolean> => {
    await api.delete(ENDPOINTS.FLOORS.DELETE(id));
    return true;
  },
};

export default floorApi;
