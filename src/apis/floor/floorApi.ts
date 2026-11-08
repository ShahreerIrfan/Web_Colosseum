import api from '@/apis/axios';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import type { CreateFloorInput, FloorModel, UpdateFloorInput } from '@/types/api/floorTypes';
import { ENDPOINTS } from '@/utils/endPoints';

const MOCK_FLOORS: FloorModel[] = [
  {
    id: 'floor_underground',
    floorId: 'floor_underground',
    landmarkCode: 'colosseum',
    levelIndex: -1,
    displayName: 'Underground (Hypogeum)',
    shortName: 'Underground',
    floorNumberLabel: 'Underground',
    semanticLabel: 'Underground Hypogeum, current floor',
    calibration: {
      centerCoordinates: {
        latitude: 41.89021,
        longitude: 12.492231,
      },
      defaultZoom: 18.6,
      mapNorthOffsetDegrees: -20.0,
    },
    mapAsset: {
      assetId: 'underground_map',
      url: 'assets/maps/underground_map.png',
    },
    isAccessibleForTier: ['arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 6,
  },
  {
    id: 'floor_1',
    floorId: 'floor_1',
    landmarkCode: 'colosseum',
    levelIndex: 1,
    displayName: 'Level 1 (Arena Floor)',
    shortName: 'Level 1',
    floorNumberLabel: 'Floor 1',
    semanticLabel: 'Level 1, current floor',
    calibration: {
      centerCoordinates: {
        latitude: 41.89021,
        longitude: 12.492231,
      },
      defaultZoom: 18.6,
      mapNorthOffsetDegrees: -20.0,
    },
    mapAsset: {
      assetId: 'floor_1_map',
      url: 'assets/floor_map/floor_level_1.svg',
    },
    isAccessibleForTier: ['general', 'arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 7,
  },
  {
    id: 'floor_2',
    floorId: 'floor_2',
    landmarkCode: 'colosseum',
    levelIndex: 2,
    displayName: 'Level 2 (Middle Tier & Promenade)',
    shortName: 'Level 2',
    floorNumberLabel: 'Floor 2',
    semanticLabel: 'Level 2, current floor',
    calibration: {
      centerCoordinates: {
        latitude: 41.89021,
        longitude: 12.492231,
      },
      defaultZoom: 18.6,
      mapNorthOffsetDegrees: -20.0,
    },
    mapAsset: {
      assetId: 'floor_2_map',
      url: 'assets/floor_map/floor_level_2.svg',
    },
    isAccessibleForTier: ['general', 'arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 4,
  },
  {
    id: 'floor_3',
    floorId: 'floor_3',
    landmarkCode: 'colosseum',
    levelIndex: 3,
    displayName: 'Level 3 (Attic & Imperial Colonnade)',
    shortName: 'Level 3',
    floorNumberLabel: 'Floor 3',
    semanticLabel: 'Level 3, current floor',
    calibration: {
      centerCoordinates: {
        latitude: 41.89021,
        longitude: 12.492231,
      },
      defaultZoom: 18.6,
      mapNorthOffsetDegrees: -20.0,
    },
    mapAsset: {
      assetId: 'floor_3_map',
      url: 'assets/floor_map/floor_level_3.svg',
    },
    isAccessibleForTier: ['full_access'],
    isPublished: true,
    viewpointCount: 2,
  },
  {
    id: 'arch_ground',
    floorId: 'arch_ground',
    landmarkCode: 'arch-of-constantine',
    levelIndex: 1,
    displayName: 'Plaza & Constantinian Reliefs',
    shortName: 'Ground',
    floorNumberLabel: 'Ground',
    semanticLabel: 'Plaza & Constantinian Reliefs, current floor',
    calibration: {
      centerCoordinates: {
        latitude: 41.8898,
        longitude: 12.4905,
      },
      defaultZoom: 19.0,
      mapNorthOffsetDegrees: 34.0,
    },
    mapAsset: {
      assetId: 'arch_ground_map',
      url: 'assets/floor_map/floor_level_1.svg',
    },
    isAccessibleForTier: ['general', 'arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 4,
  },
  {
    id: 'arch_attic',
    floorId: 'arch_attic',
    landmarkCode: 'arch-of-constantine',
    levelIndex: 2,
    displayName: 'Attic & Upper Inscription Terrace',
    shortName: 'Attic',
    floorNumberLabel: 'Attic',
    semanticLabel: 'Attic level, arch overlook',
    calibration: {
      centerCoordinates: {
        latitude: 41.8898,
        longitude: 12.4905,
      },
      defaultZoom: 19.0,
      mapNorthOffsetDegrees: 34.0,
    },
    mapAsset: {
      assetId: 'arch_attic_map',
      url: 'assets/floor_map/floor_level_2.svg',
    },
    isAccessibleForTier: ['full_access'],
    isPublished: true,
    viewpointCount: 2,
  },
  {
    id: 'forum_via_sacra',
    floorId: 'forum_via_sacra',
    landmarkCode: 'roman-forum',
    levelIndex: 1,
    displayName: 'Via Sacra & Triumphal Way',
    shortName: 'Via Sacra',
    floorNumberLabel: 'Ground',
    semanticLabel: 'Via Sacra, ancient paving stone road',
    calibration: {
      centerCoordinates: {
        latitude: 41.8925,
        longitude: 12.4853,
      },
      defaultZoom: 18.0,
      mapNorthOffsetDegrees: 12.0,
    },
    mapAsset: {
      assetId: 'forum_via_sacra_map',
      url: 'assets/floor_map/floor_level_1.svg',
    },
    isAccessibleForTier: ['general', 'arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 5,
  },
  {
    id: 'forum_senate_rostra',
    floorId: 'forum_senate_rostra',
    landmarkCode: 'roman-forum',
    levelIndex: 1,
    displayName: 'Senate, Curia & The Rostra',
    shortName: 'Curia',
    floorNumberLabel: 'Ground',
    semanticLabel: 'Roman Senate Curia Julia and speech podium',
    calibration: {
      centerCoordinates: {
        latitude: 41.8928,
        longitude: 12.4849,
      },
      defaultZoom: 18.5,
      mapNorthOffsetDegrees: 12.0,
    },
    mapAsset: {
      assetId: 'forum_rostra_map',
      url: 'assets/floor_map/floor_level_1.svg',
    },
    isAccessibleForTier: ['general', 'arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 3,
  },
  {
    id: 'ludus_arena',
    floorId: 'ludus_arena',
    landmarkCode: 'ludus-magnus',
    levelIndex: 1,
    displayName: 'Gladiator Arena & Cavea',
    shortName: 'Arena',
    floorNumberLabel: 'Level 1',
    semanticLabel: 'Gladiator training ground and barracks',
    calibration: {
      centerCoordinates: {
        latitude: 41.8906,
        longitude: 12.4952,
      },
      defaultZoom: 19.0,
      mapNorthOffsetDegrees: -8.0,
    },
    mapAsset: {
      assetId: 'ludus_arena_map',
      url: 'assets/floor_map/floor_level_1.svg',
    },
    isAccessibleForTier: ['general', 'arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 4,
  },
  {
    id: 'ludus_tunnel',
    floorId: 'ludus_tunnel',
    landmarkCode: 'ludus-magnus',
    levelIndex: -1,
    displayName: 'Subterranean Tunnel to Colosseum',
    shortName: 'Tunnel',
    floorNumberLabel: 'Underground',
    semanticLabel: 'Underground tunnel connecting Ludus Magnus to Hypogeum',
    calibration: {
      centerCoordinates: {
        latitude: 41.8904,
        longitude: 12.4938,
      },
      defaultZoom: 19.2,
      mapNorthOffsetDegrees: -8.0,
    },
    mapAsset: {
      assetId: 'ludus_tunnel_map',
      url: 'assets/maps/underground_map.png',
    },
    isAccessibleForTier: ['arena_priority', 'full_access'],
    isPublished: true,
    viewpointCount: 2,
  },
];

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
  const match = MOCK_FLOORS.find((f) => f.floorId === floorId || f.id === floorId);

  return {
    id: raw.id || raw._id || floorId,
    floorId,
    landmarkCode: raw.landmarkCode || match?.landmarkCode || 'colosseum',
    levelIndex: raw.levelIndex ?? raw.levelNumber ?? match?.levelIndex ?? 1,
    displayName: raw.displayName || raw.floorName || raw.name || match?.displayName || 'Floor Map',
    shortName: raw.shortName || match?.shortName || raw.floorName || 'Floor',
    floorNumberLabel:
      raw.floorNumberLabel || match?.floorNumberLabel || `Floor ${raw.levelIndex ?? 1}`,
    semanticLabel: raw.semanticLabel || match?.semanticLabel || '',
    calibration: {
      centerCoordinates: {
        latitude:
          raw.calibration?.centerCoordinates?.latitude ??
          match?.calibration?.centerCoordinates?.latitude ??
          41.89021,
        longitude:
          raw.calibration?.centerCoordinates?.longitude ??
          match?.calibration?.centerCoordinates?.longitude ??
          12.492231,
      },
      defaultZoom: raw.calibration?.defaultZoom ?? match?.calibration?.defaultZoom ?? 18.6,
      mapNorthOffsetDegrees:
        raw.calibration?.mapNorthOffsetDegrees ??
        match?.calibration?.mapNorthOffsetDegrees ??
        -20.0,
    },
    mapAsset: {
      assetId: raw.mapAsset?.assetId || match?.mapAsset?.assetId || `${floorId}_map`,
      url: raw.mapAsset?.url || match?.mapAsset?.url || '',
      cloudinaryPublicId:
        raw.mapAsset?.cloudinaryPublicId || match?.mapAsset?.cloudinaryPublicId || '',
    },
    isAccessibleForTier: raw.isAccessibleForTier ||
      match?.isAccessibleForTier || ['general', 'arena_priority', 'full_access'],
    isPublished: raw.isPublished ?? match?.isPublished ?? true,
    viewpointCount: raw.viewpointCount ?? match?.viewpointCount ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const floorApi = {
  getAll: async (landmarkCode?: string): Promise<FloorModel[]> => {
    try {
      const endpoint = landmarkCode
        ? `${ENDPOINTS.FLOORS.LIST}?landmark=${encodeURIComponent(landmarkCode)}`
        : ENDPOINTS.FLOORS.LIST;
      const response = await api.get<BaseSuccessResponse<BackendFloorRaw[]>>(endpoint);
      const rawList =
        response.data.data ||
        (response.data as unknown as { payload: BackendFloorRaw[] }).payload ||
        [];
      const mapped = rawList.map(mapRawFloor);
      return mapped.length > 0 ? mapped : MOCK_FLOORS;
    } catch {
      if (landmarkCode) {
        return MOCK_FLOORS.filter((f) => f.landmarkCode === landmarkCode);
      }
      return MOCK_FLOORS;
    }
  },

  getById: async (id: string): Promise<FloorModel> => {
    try {
      const response = await api.get<BaseSuccessResponse<BackendFloorRaw>>(
        ENDPOINTS.FLOORS.GET_BY_ID(id)
      );
      const raw =
        response.data.data || (response.data as unknown as { payload: BackendFloorRaw }).payload;
      return mapRawFloor(raw);
    } catch {
      const found = MOCK_FLOORS.find((f) => f.id === id || f.floorId === id);
      if (!found) {
        throw new Error(`Floor with ID "${id}" not found.`);
      }
      return found;
    }
  },

  create: async (payload: CreateFloorInput): Promise<FloorModel> => {
    try {
      const response = await api.post<BaseSuccessResponse<BackendFloorRaw>>(
        ENDPOINTS.FLOORS.CREATE,
        payload
      );
      const raw =
        response.data.data || (response.data as unknown as { payload: BackendFloorRaw }).payload;
      const created = mapRawFloor(raw);
      MOCK_FLOORS.unshift(created);
      return created;
    } catch {
      // Offline fallback: save locally
      const newFloor: FloorModel = {
        id: payload.floorId,
        floorId: payload.floorId,
        landmarkCode: payload.landmarkCode,
        levelIndex: payload.levelIndex,
        displayName: payload.displayName,
        shortName: payload.shortName,
        floorNumberLabel: payload.floorNumberLabel,
        semanticLabel: payload.semanticLabel || '',
        calibration: payload.calibration,
        mapAsset: payload.mapAsset,
        isAccessibleForTier: payload.isAccessibleForTier,
        isPublished: payload.isPublished,
        viewpointCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_FLOORS.unshift(newFloor);
      return newFloor;
    }
  },

  update: async (id: string, payload: UpdateFloorInput): Promise<FloorModel> => {
    try {
      const response = await api.patch<BaseSuccessResponse<BackendFloorRaw>>(
        ENDPOINTS.FLOORS.UPDATE(id),
        payload
      );
      const raw =
        response.data.data || (response.data as unknown as { payload: BackendFloorRaw }).payload;
      const updated = mapRawFloor(raw);
      const idx = MOCK_FLOORS.findIndex((f) => f.id === id || f.floorId === id);
      if (idx !== -1) {
        MOCK_FLOORS[idx] = updated;
      }
      return updated;
    } catch {
      const idx = MOCK_FLOORS.findIndex((f) => f.id === id || f.floorId === id);
      const existing = idx !== -1 ? MOCK_FLOORS[idx] : null;
      const updated: FloorModel = {
        id: existing?.id || id,
        floorId: payload.floorId || existing?.floorId || id,
        landmarkCode: payload.landmarkCode || existing?.landmarkCode || 'colosseum',
        levelIndex: payload.levelIndex ?? existing?.levelIndex ?? 1,
        displayName: payload.displayName || existing?.displayName || 'Floor Map',
        shortName: payload.shortName || existing?.shortName || 'Floor',
        floorNumberLabel: payload.floorNumberLabel || existing?.floorNumberLabel || 'Floor',
        semanticLabel: payload.semanticLabel ?? existing?.semanticLabel,
        calibration: payload.calibration || existing?.calibration,
        mapAsset: payload.mapAsset || existing?.mapAsset,
        isAccessibleForTier: payload.isAccessibleForTier ||
          existing?.isAccessibleForTier || ['general'],
        isPublished: payload.isPublished ?? existing?.isPublished ?? true,
        viewpointCount: existing?.viewpointCount ?? 0,
        updatedAt: new Date().toISOString(),
      };
      if (idx !== -1) {
        MOCK_FLOORS[idx] = updated;
      }
      return updated;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(ENDPOINTS.FLOORS.DELETE(id));
      const idx = MOCK_FLOORS.findIndex((f) => f.id === id || f.floorId === id);
      if (idx !== -1) MOCK_FLOORS.splice(idx, 1);
      return true;
    } catch {
      const idx = MOCK_FLOORS.findIndex((f) => f.id === id || f.floorId === id);
      if (idx !== -1) MOCK_FLOORS.splice(idx, 1);
      return true;
    }
  },
};

export default floorApi;
