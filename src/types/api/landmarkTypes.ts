export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface FloorLevel {
  id: string;
  floorId: string;
  landmarkCode: string;
  levelNumber: number;
  name: string;
  description: string;
  svgFloorPlanUrl?: string;
  viewpointCount: number;
}

export interface TourAudio {
  title: string;
  description: string;
  audioUrl: string;
  audioDuration: string;
  language: string;
}

export interface Viewpoint {
  id: string;
  viewpointId: string;
  floorId: string;
  order: number;
  title: string;
  description: string;
  canvasCoordinates: {
    normalizedX: number;
    normalizedY: number;
  };
  location: GeoLocation;
  triggerRadiusMeters: number;
  targetGazeHeadingDegrees?: number | null;
  audio?: TourAudio;
  imageUrl?: string;
  isPublished: boolean;
}

export interface ItinerarySegment {
  id: string;
  segmentId: string;
  fromViewpointId: string;
  toViewpointId: string;
  estimatedWalkTimeSeconds: number;
  distanceMeters: number;
  instructionText: string;
}

export interface Landmark {
  id: string;
  code: string;
  name: string;
  romanEraName?: string;
  description: string;
  assetPath: string;
  thumbnailUrl: string;
  location: GeoLocation;
  dimensions: {
    widthMeters: number;
    heightMeters: number;
  };
  calibration: {
    rotationDegrees: number;
    anchorX: number;
    anchorY: number;
  };
  viewpointCount: number;
  floorCount: number;
  estimatedTourDurationMinutes: number;
  isPublished: boolean;
  floors?: FloorLevel[];
  viewpoints?: Viewpoint[];
}

export interface LandmarkCard {
  id: string;
  code: string;
  name: string;
  romanEraName?: string;
  description: string;
  thumbnailUrl: string;
  levelCount: number;
  viewpointCount: number;
  estimatedTourDurationMinutes: number;
  badge?: string;
  rating?: number;
  highlights?: string[];
}

export interface ViewpointSnippet {
  id: string;
  viewpointId: string;
  title: string;
  subtitle: string;
  monumentName: string;
  audioDuration: string;
  audioUrl: string;
  transcriptExcerpt: string;
  floorName: string;
  imageUrl?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  viewpointName: string;
  monumentName: string;
  audioUrl: string;
  durationSeconds: number;
  durationLabel: string;
  speaker: string;
  bitrate: string;
  transcript: string;
}

export interface VisitorFaqItem {
  id: string;
  question: string;
  answer: string;
  category?: 'installation' | 'offline' | 'battery' | 'calibration' | 'ticket';
}
