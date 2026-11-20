export interface FloorCoordinates {
  latitude: number;
  longitude: number;
}

export interface FloorCalibration {
  centerCoordinates: FloorCoordinates;
  defaultZoom: number;
  mapNorthOffsetDegrees: number;
}

export interface FloorMapAsset {
  assetId: string;
  url?: string;
  cloudinaryPublicId?: string;
}

export interface FloorPortalModel {
  id: string;
  name: string;
  fromFloorId: string;
  toFloorId: string;
  fromViewpointId?: string;
  toViewpointId?: string;
  normalizedX: number;
  normalizedY: number;
  coordinates?: FloorCoordinates;
  elevationDeltaMeters: number;
  isAscending: boolean;
  triggerRadiusMeters: number;
}

export interface FloorModel {
  id: string;
  floorId: string;
  landmarkCode: string;
  levelIndex: number;
  displayName: string;
  shortName: string;
  floorNumberLabel: string;
  semanticLabel?: string;
  calibration?: FloorCalibration;
  mapAsset?: FloorMapAsset;
  isAccessibleForTier?: string[];
  isPublished: boolean;
  elevationMeters?: number;
  autoFloorDetectionEnabled?: boolean;
  portals?: FloorPortalModel[];
  viewpointCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFloorInput {
  floorId: string;
  landmarkCode: string;
  levelIndex: number;
  displayName: string;
  shortName: string;
  floorNumberLabel: string;
  semanticLabel?: string;
  calibration: FloorCalibration;
  mapAsset?: FloorMapAsset;
  isAccessibleForTier: string[];
  isPublished: boolean;
  elevationMeters?: number;
  autoFloorDetectionEnabled?: boolean;
  portals?: FloorPortalModel[];
}

export type UpdateFloorInput = Partial<CreateFloorInput>;
