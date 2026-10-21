import api from '@/apis/axios';
import type { BaseSuccessResponse, PaginationParams } from '@/types/api/CommonTypes';
import type {
  AudioTrack,
  FloorLevel,
  Landmark,
  LandmarkCard,
  Viewpoint,
  VisitorFaqItem,
} from '@/types/api/landmarkTypes';
import { ENDPOINTS } from '@/utils/endPoints';

// Authentic initial data matching Colosseum mobile app and database
const MOCK_LANDMARKS: Landmark[] = [
  {
    id: 'colosseum',
    code: 'colosseum',
    name: 'Colosseum (Flavian Amphitheatre)',
    romanEraName: 'Amphitheatrum Flavium',
    description:
      'The largest ancient amphitheatre ever built, constructed of travertine limestone, tuff, and brick-faced concrete under Emperors Vespasian and Titus (70–80 AD).',
    assetPath: 'assets/logo/Colosseum.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    location: {
      type: 'Point',
      coordinates: [12.492231, 41.89021],
    },
    dimensions: {
      widthMeters: 188,
      heightMeters: 156,
    },
    calibration: {
      rotationDegrees: -18.5,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    viewpointCount: 19,
    floorCount: 4,
    estimatedTourDurationMinutes: 75,
    isPublished: true,
  },
  {
    id: 'roman-forum',
    code: 'roman-forum',
    name: 'Roman Forum',
    romanEraName: 'Forum Romanum',
    description:
      'The rectangular plaza surrounded by the ruins of several important ancient government buildings at the center of the city of Rome.',
    assetPath: 'assets/logo/Roman Forum.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=800&auto=format&fit=crop&q=80',
    location: {
      type: 'Point',
      coordinates: [12.4853, 41.8925],
    },
    dimensions: {
      widthMeters: 250,
      heightMeters: 170,
    },
    calibration: {
      rotationDegrees: 12.0,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    viewpointCount: 6,
    floorCount: 1,
    estimatedTourDurationMinutes: 60,
    isPublished: true,
  },
  {
    id: 'palatine-hill',
    code: 'palatine-hill',
    name: 'Palatine Hill',
    romanEraName: 'Collis Palatinus',
    description:
      'The centremost of the Seven Hills of Rome and one of the most ancient parts of the city, looking over the Roman Forum on one side and the Circus Maximus on the other.',
    assetPath: 'assets/logo/Temple of Venus and Rome.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&auto=format&fit=crop&q=80',
    location: {
      type: 'Point',
      coordinates: [12.4878, 41.8892],
    },
    dimensions: {
      widthMeters: 300,
      heightMeters: 220,
    },
    calibration: {
      rotationDegrees: 0.0,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    viewpointCount: 4,
    floorCount: 1,
    estimatedTourDurationMinutes: 45,
    isPublished: true,
  },
  {
    id: 'arch-of-constantine',
    code: 'arch-of-constantine',
    name: 'Arch of Constantine',
    romanEraName: 'Arcus Constantini',
    description:
      'Triumphal arch dedicated to Emperor Constantine the Great, erected in 315 AD to commemorate his victory at the Battle of Milvian Bridge.',
    assetPath: 'assets/logo/Arch of Constantine.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=800&auto=format&fit=crop&q=80',
    location: {
      type: 'Point',
      coordinates: [12.4905, 41.8898],
    },
    dimensions: {
      widthMeters: 25,
      heightMeters: 21,
    },
    calibration: {
      rotationDegrees: 34.0,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    viewpointCount: 2,
    floorCount: 1,
    estimatedTourDurationMinutes: 20,
    isPublished: true,
  },
  {
    id: 'ludus-magnus',
    code: 'ludus-magnus',
    name: 'Ludus Magnus (Gladiator Barracks)',
    romanEraName: 'The Great Gladiatorial Training School',
    description:
      'The largest of the gladiatorial arenas in Rome, built by Emperor Domitian (81–96 AD) directly adjacent to the Colosseum connected via an underground tunnel.',
    assetPath: 'assets/logo/Ludus Magnus.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1599739291060-4578e77dac5d?w=800&auto=format&fit=crop&q=80',
    location: {
      type: 'Point',
      coordinates: [12.4952, 41.8906],
    },
    dimensions: {
      widthMeters: 75,
      heightMeters: 55,
    },
    calibration: {
      rotationDegrees: -8.0,
      anchorX: 0.5,
      anchorY: 0.5,
    },
    viewpointCount: 2,
    floorCount: 1,
    estimatedTourDurationMinutes: 25,
    isPublished: true,
  },
];

const MOCK_COLOSSEUM_FLOORS: FloorLevel[] = [
  {
    id: 'floor_underground',
    floorId: 'floor_underground',
    landmarkCode: 'colosseum',
    levelNumber: 0,
    name: 'Hypogeum (Underground Chambers)',
    description:
      'The dark subterranean maze of tunnels, holding cages, and lifting mechanisms for gladiators and wild beasts.',
    viewpointCount: 6,
  },
  {
    id: 'floor_arena',
    floorId: 'floor_arena',
    landmarkCode: 'colosseum',
    levelNumber: 1,
    name: 'Arena Floor & Ground Level',
    description:
      'The central timber stage where mortal combats were staged, reconstructed with modern decking.',
    viewpointCount: 5,
  },
  {
    id: 'floor_1',
    floorId: 'floor_1',
    landmarkCode: 'colosseum',
    levelNumber: 2,
    name: 'First Tier (Senators & Equites)',
    description:
      'The prime ringside marble benches reserved for Roman emperors, vestal virgins, and noble senators.',
    viewpointCount: 4,
  },
  {
    id: 'floor_2',
    floorId: 'floor_2',
    landmarkCode: 'colosseum',
    levelNumber: 3,
    name: 'Second Tier & Outer Promenade',
    description: 'Panoramic vantage point over the arena and ancient imperial avenues of Rome.',
    viewpointCount: 4,
  },
];

const MOCK_VIEWPOINTS: Viewpoint[] = [
  {
    id: 'vp_01',
    viewpointId: 'vp_gladiator_gate',
    floorId: 'floor_underground',
    order: 1,
    title: 'Porta Libitinensis (Gate of Death)',
    description:
      'The exit gate through which fallen gladiators and slain beasts were carried out of the arena to the morgue.',
    canvasCoordinates: { normalizedX: 0.42, normalizedY: 0.58 },
    location: { type: 'Point', coordinates: [12.4921, 41.8901] },
    triggerRadiusMeters: 3.5,
    audio: {
      title: 'Echoes of the Underworld',
      description: 'Audio walkthrough of the gladiator preparations.',
      audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
      audioDuration: '2:45',
      language: 'en',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&auto=format&fit=crop',
    isPublished: true,
  },
  {
    id: 'vp_02',
    viewpointId: 'vp_beast_lift',
    floorId: 'floor_underground',
    order: 2,
    title: 'Mechanical Beast Lifts & Trapdoors',
    description:
      'Winches and counterweighted pulleys operated by hundreds of slaves to hoist ferocious lions into the arena.',
    canvasCoordinates: { normalizedX: 0.51, normalizedY: 0.48 },
    location: { type: 'Point', coordinates: [12.4923, 41.8903] },
    triggerRadiusMeters: 3.0,
    audio: {
      title: 'The Great Machinery',
      description: 'Engineering behind the scenic spectacle.',
      audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
      audioDuration: '3:10',
      language: 'en',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=500&auto=format&fit=crop',
    isPublished: true,
  },
  {
    id: 'vp_03',
    viewpointId: 'vp_emperor_box',
    floorId: 'floor_1',
    order: 3,
    title: 'Imperial Pulvinar (Emperor’s Box)',
    description:
      'The opulent royal podium where Caesar sat beneath velarium awnings, delivering thumbs up or thumbs down judgments.',
    canvasCoordinates: { normalizedX: 0.55, normalizedY: 0.35 },
    location: { type: 'Point', coordinates: [12.4925, 41.8905] },
    triggerRadiusMeters: 4.0,
    audio: {
      title: 'Verdict of the Caesar',
      description: 'The spectacle of Roman imperial authority.',
      audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
      audioDuration: '2:15',
      language: 'en',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=500&auto=format&fit=crop',
    isPublished: true,
  },
];

const MOCK_FEATURED_LANDMARKS: LandmarkCard[] = [
  {
    id: 'colosseum',
    code: 'colosseum',
    name: 'The Colosseum (Flavian Amphitheatre)',
    romanEraName: 'Amphitheatrum Flavium',
    description:
      'The largest amphitheatre of antiquity. Features 4 grand architectural tiers, reconstructed arena decking, and subterranean hypogeum vaults.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    levelCount: 4,
    viewpointCount: 7,
    estimatedTourDurationMinutes: 75,
    badge: 'Underground Access',
    rating: 4.9,
    highlights: ['Arena Floor & Hypogeum', 'Gate of Death', 'Imperial Pulvinar'],
  },
  {
    id: 'roman-forum',
    code: 'roman-forum',
    name: 'Roman Forum',
    romanEraName: 'Forum Romanum',
    description:
      'The civic, commercial, and political epicenter of ancient Rome containing temples, triumphal arches, and the Roman Senate House.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=800&auto=format&fit=crop&q=80',
    levelCount: 2,
    viewpointCount: 7,
    estimatedTourDurationMinutes: 60,
    badge: 'Most Popular',
    rating: 4.8,
    highlights: ['Via Sacra', 'Curia Julia', 'Temple of Saturn'],
  },
  {
    id: 'arch-of-constantine',
    code: 'arch-of-constantine',
    name: 'Arch of Constantine',
    romanEraName: 'Arcus Constantini',
    description:
      'Triumphal marble monument erected in 315 AD along the Via Triumphalis celebrating Emperor Constantine’s victory at the Battle of the Milvian Bridge.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=800&auto=format&fit=crop&q=80',
    levelCount: 2,
    viewpointCount: 6,
    estimatedTourDurationMinutes: 20,
    badge: 'Triumphal Reliefs',
    rating: 4.7,
    highlights: ['Triumphal Way', 'Attic Sculptures', 'Imperial Medallions'],
  },
  {
    id: 'ludus-magnus',
    code: 'ludus-magnus',
    name: 'Ludus Magnus (Gladiator Barracks)',
    romanEraName: 'The Great Gladiatorial School',
    description:
      'The premier training academy for imperial gladiators built by Emperor Domitian, featuring living barracks and an underground tunnel connecting to the arena.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1599739291060-4578e77dac5d?w=800&auto=format&fit=crop&q=80',
    levelCount: 2,
    viewpointCount: 5,
    estimatedTourDurationMinutes: 25,
    badge: 'Gladiator Quarters',
    rating: 4.8,
    highlights: ['Gladiator Barracks', 'Subterranean Tunnel', 'Practice Amphitheatre'],
  },
  {
    id: 'temple-of-venus-and-rome',
    code: 'temple-of-venus-and-rome',
    name: 'Temple of Venus & Rome',
    romanEraName: 'Templum Veneris et Romae',
    description:
      'The largest known temple in ancient Rome, personally designed by Emperor Hadrian with mirrored colossal cellae dedicated to Venus Felix and Roma Aeterna.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&auto=format&fit=crop&q=80',
    levelCount: 2,
    viewpointCount: 5,
    estimatedTourDurationMinutes: 30,
    badge: 'Largest Temple in Rome',
    rating: 4.6,
    highlights: ['Dual Cellae', 'Hadrianic Architecture', 'Colosseum Vista'],
  },
];

const MOCK_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'track_01',
    title: 'The Hypogeum Gladiatorial Lifts',
    viewpointName: 'Subterranean Vault 04',
    monumentName: 'The Colosseum',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
    durationSeconds: 165,
    durationLabel: '02:45',
    speaker: 'Marcus Valerius (Senior Archaeologist)',
    bitrate: '320 kbps HD',
    transcript:
      'Beneath the sands of the arena floor lies a labyrinth of 32 mechanical trapdoors and counterweighted pulleys. Operated by hundreds of subterranean workers, these wooden lifts hoisted African lions, leopards, and armored gladiators upward into the blinding Roman sun to astonishment of 50,000 roaring spectators...',
  },
  {
    id: 'track_02',
    title: 'Arch of Titus: Spoils of Jerusalem',
    viewpointName: 'Via Sacra Summit',
    monumentName: 'Roman Forum',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
    durationSeconds: 195,
    durationLabel: '03:15',
    speaker: 'Dr. Elena Rostova (Roman Historian)',
    bitrate: '320 kbps HD',
    transcript:
      'Carved into the inner passageway of the arch is one of the most famous relief sculptures of antiquity: Roman legionaries carrying the sacred Menorah and silver trumpets of the Temple of Jerusalem in triumphant procession after the campaign of 70 AD...',
  },
  {
    id: 'track_03',
    title: 'Ludus Magnus Arena & Secret Tunnel',
    viewpointName: 'Gladiator Barracks Quadrangle',
    monumentName: 'Ludus Magnus',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
    durationSeconds: 135,
    durationLabel: '02:15',
    speaker: 'Marcus Valerius (Senior Archaeologist)',
    bitrate: '320 kbps HD',
    transcript:
      'Here in these brick chambers lived the champion Murmillones and Retiarii under the strict discipline of the Lanista. On morning spectacles, they would march down through the dark vaulted underground tunnel directly emerging onto the Colosseum arena sands...',
  },
];

const MOCK_FAQS: VisitorFaqItem[] = [
  {
    id: 'faq_01',
    question: 'How do I resolve Samsung One UI 6+ Auto Blocker preventing APK installation?',
    answer:
      'On Samsung devices running One UI 6+, side-loaded APKs are restricted by default. To resolve: navigate to Settings > Security and Privacy > Auto Blocker, and toggle it temporarily to "Off". Once installation is complete, you may re-enable it.',
    category: 'installation',
  },
  {
    id: 'faq_02',
    question: 'How do I proceed if Google Play Protect shows an unverified application notice?',
    answer:
      'Because this is a standalone offline professional guide package, tap "More details" in the warning dialog and select "Install anyway". Each official release is cryptographically signed and SHA-256 verified for safety.',
    category: 'installation',
  },
  {
    id: 'faq_03',
    question: 'How do I prevent Android battery optimization from pausing background audio?',
    answer:
      'To prevent Android OS from sleeping background sensors: open Settings > Apps > Colosseum Tour Guide > Battery, and choose "Unrestricted". This ensures seamless audio playback and GPS dead-reckoning while your phone is in your pocket.',
    category: 'battery',
  },
  {
    id: 'faq_04',
    question:
      'How do I recalibrate the compass near modern metal scaffolding inside the Colosseum?',
    answer:
      'Reinforced steel restoration scaffolding can cause electromagnetic deviation in phone magnetometers. Wave your phone in a smooth figure-8 motion in the air for 5 seconds to recalibrate the compass sensors.',
    category: 'calibration',
  },
];

// Helper mapper to safely normalize live backend landmarks to frontend schema
interface BackendLandmarkRaw {
  id: string;
  code?: string;
  name?: string;
  romanEraName?: string;
  description?: string;
  assetPath?: string;
  thumbnailUrl?: string;
  center?: { latitude: number; longitude: number };
  location?: { type: 'Point'; coordinates: [number, number] };
  widthMeters?: number;
  heightMeters?: number;
  rotationDegrees?: number;
  anchorX?: number;
  anchorY?: number;
  dimensions?: { widthMeters: number; heightMeters: number };
  calibration?: { rotationDegrees: number; anchorX: number; anchorY: number };
  viewpointCount?: number;
  floorCount?: number;
  estimatedTourDurationMinutes?: number;
  isPublished?: boolean;
}

interface BackendFloorRaw {
  id: string;
  floorId?: string;
  landmarkCode?: string;
  floorName?: string;
  name?: string;
  levelIndex?: number;
  levelNumber?: number;
  description?: string;
  viewpointCount?: number;
}

interface BackendViewpointRaw {
  id: string;
  viewpointId?: string;
  floorId: string;
  order?: number;
  title?: string;
  description?: string;
  normalizedX?: number;
  normalizedY?: number;
  canvasCoordinates?: { normalizedX: number; normalizedY: number };
  latitude?: number;
  longitude?: number;
  location?: { type: 'Point'; coordinates: [number, number] };
  triggerRadiusMeters?: number;
  targetGazeHeadingDegrees?: number | null;
  audioDuration?: string;
  audioUrl?: string;
  isPublished?: boolean;
}

const mapRawLandmark = (raw: BackendLandmarkRaw): Landmark => {
  const match = MOCK_LANDMARKS.find((m) => m.id === raw.id || m.code === (raw.code || raw.id));
  const code = raw.code || raw.id || match?.code || 'colosseum';
  return {
    id: raw.id || match?.id || code,
    code,
    name: raw.name || match?.name || 'Ancient Roman Landmark',
    romanEraName: raw.romanEraName || match?.romanEraName || 'Monumentum Romanum',
    description: raw.description || match?.description || '',
    assetPath: raw.assetPath || match?.assetPath || '',
    thumbnailUrl:
      raw.thumbnailUrl ||
      match?.thumbnailUrl ||
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    location: raw.location || {
      type: 'Point',
      coordinates: raw.center
        ? [raw.center.longitude, raw.center.latitude]
        : match?.location.coordinates || [12.4922, 41.8902],
    },
    dimensions: raw.dimensions || {
      widthMeters: raw.widthMeters ?? (match?.dimensions.widthMeters || 100),
      heightMeters: raw.heightMeters ?? (match?.dimensions.heightMeters || 100),
    },
    calibration: raw.calibration || {
      rotationDegrees: raw.rotationDegrees ?? (match?.calibration.rotationDegrees || 0),
      anchorX: raw.anchorX ?? (match?.calibration.anchorX || 0.5),
      anchorY: raw.anchorY ?? (match?.calibration.anchorY || 0.5),
    },
    viewpointCount: raw.viewpointCount ?? (match?.viewpointCount || 5),
    floorCount: raw.floorCount ?? (match?.floorCount || 2),
    estimatedTourDurationMinutes:
      raw.estimatedTourDurationMinutes ?? (match?.estimatedTourDurationMinutes || 30),
    isPublished: raw.isPublished ?? true,
    floors: match?.floors || MOCK_COLOSSEUM_FLOORS,
    viewpoints: match?.viewpoints || MOCK_VIEWPOINTS,
  };
};

export const landmarkApi = {
  getAll: async (params?: PaginationParams): Promise<Landmark[]> => {
    try {
      const response = await api.get<BaseSuccessResponse<BackendLandmarkRaw[]>>(
        ENDPOINTS.LANDMARKS.LIST,
        { params }
      );
      const rawList =
        response.data.data ||
        (response.data as unknown as { payload: BackendLandmarkRaw[] }).payload ||
        [];
      const mapped = rawList.map(mapRawLandmark);
      if (params?.search) {
        const q = params.search.toLowerCase();
        return mapped.filter(
          (item) =>
            item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
      }
      return mapped.length > 0 ? mapped : MOCK_LANDMARKS;
    } catch {
      let filtered = [...MOCK_LANDMARKS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  getById: async (id: string): Promise<Landmark> => {
    try {
      const response = await api.get<BaseSuccessResponse<BackendLandmarkRaw>>(
        ENDPOINTS.LANDMARKS.GET_BY_ID(id)
      );
      const raw =
        response.data.data || (response.data as unknown as { payload: BackendLandmarkRaw }).payload;
      return mapRawLandmark(raw);
    } catch {
      const found = MOCK_LANDMARKS.find((l) => l.id === id || l.code === id);
      if (!found) {
        throw new Error('Landmark not found');
      }
      return {
        ...found,
        floors: MOCK_COLOSSEUM_FLOORS,
        viewpoints: MOCK_VIEWPOINTS,
      };
    }
  },

  getFloors: async (code: string): Promise<FloorLevel[]> => {
    try {
      const response = await api.get<BaseSuccessResponse<BackendFloorRaw[]>>(
        ENDPOINTS.LANDMARKS.GET_FLOORS(code)
      );
      const rawList =
        response.data.data ||
        (response.data as unknown as { payload: BackendFloorRaw[] }).payload ||
        [];
      return rawList.map((f, idx) => ({
        id: f.id || `floor_${idx}`,
        floorId: f.floorId || f.id || `floor_${idx}`,
        landmarkCode: f.landmarkCode || code,
        levelNumber: f.levelNumber ?? f.levelIndex ?? idx,
        name: f.name || f.floorName || `Level ${idx}`,
        description: f.description || `Architectural tier ${idx}`,
        viewpointCount: f.viewpointCount || 4,
      }));
    } catch {
      return MOCK_COLOSSEUM_FLOORS;
    }
  },

  getViewpoints: async (floorId: string): Promise<Viewpoint[]> => {
    try {
      const response = await api.get<BaseSuccessResponse<BackendViewpointRaw[]>>(
        ENDPOINTS.LANDMARKS.GET_VIEWPOINTS(floorId)
      );
      const rawList =
        response.data.data ||
        (response.data as unknown as { payload: BackendViewpointRaw[] }).payload ||
        [];
      if (rawList.length > 0) {
        return rawList.map((vp, idx) => ({
          id: vp.id || `vp_${idx}`,
          viewpointId: vp.viewpointId || vp.id || `vp_${idx}`,
          floorId: vp.floorId || floorId,
          order: vp.order ?? idx + 1,
          title: vp.title || `Vantage Point ${idx + 1}`,
          description: vp.description || 'Historical audio observation point.',
          canvasCoordinates: vp.canvasCoordinates || {
            normalizedX: vp.normalizedX ?? 0.5,
            normalizedY: vp.normalizedY ?? 0.5,
          },
          location: vp.location || {
            type: 'Point',
            coordinates: [vp.longitude ?? 12.4922, vp.latitude ?? 41.8902],
          },
          triggerRadiusMeters: vp.triggerRadiusMeters || 3.5,
          targetGazeHeadingDegrees: vp.targetGazeHeadingDegrees ?? null,
          audio: {
            title: vp.title || 'Historical Walkthrough',
            description: vp.description || 'Narrated tour segment.',
            audioUrl:
              vp.audioUrl || 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg',
            audioDuration: vp.audioDuration || '2:30',
            language: 'en',
          },
          isPublished: vp.isPublished ?? true,
        }));
      }
      return MOCK_VIEWPOINTS.filter((vp) => vp.floorId === floorId || !floorId);
    } catch {
      return MOCK_VIEWPOINTS.filter((vp) => vp.floorId === floorId || !floorId);
    }
  },

  getFeaturedLandmarks: async (): Promise<LandmarkCard[]> => {
    try {
      const response = await api.get<BaseSuccessResponse<LandmarkCard[]>>(
        ENDPOINTS.LANDMARKS.FEATURED
      );
      return response.data.data;
    } catch {
      return MOCK_FEATURED_LANDMARKS;
    }
  },

  getAudioSample: async (): Promise<AudioTrack[]> => {
    try {
      const response = await api.get<BaseSuccessResponse<AudioTrack[]>>(
        ENDPOINTS.LANDMARKS.AUDIO_SAMPLE
      );
      return response.data.data;
    } catch {
      return MOCK_AUDIO_TRACKS;
    }
  },

  getFaqs: async (): Promise<VisitorFaqItem[]> => {
    try {
      const response = await api.get<BaseSuccessResponse<VisitorFaqItem[]>>(
        ENDPOINTS.LANDMARKS.FAQS
      );
      return response.data.data;
    } catch {
      return MOCK_FAQS;
    }
  },
};
