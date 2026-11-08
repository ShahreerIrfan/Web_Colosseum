export interface ViewpointModel {
  id: string;
  floorId: string;
  title: string;
  order: number;
  description?: string;
  normalizedX: number;
  normalizedY: number;
  latitude: number | null;
  longitude: number | null;
  imageAsset?: string;
  audioUrl?: string;
  audioDuration?: string;
  isVisited?: boolean;
  triggerRadiusMeters?: number;
  targetGazeHeadingDegrees?: number | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateViewpointInput {
  id: string;
  floorId: string;
  title: string;
  order: number;
  description?: string;
  normalizedX?: number;
  normalizedY?: number;
  latitude?: number | null;
  longitude?: number | null;
  imageAsset?: string;
  audioUrl?: string;
  audioDuration?: string;
  triggerRadiusMeters?: number;
  targetGazeHeadingDegrees?: number | null;
  isPublished?: boolean;
}

export type UpdateViewpointInput = Partial<CreateViewpointInput>;
