export const ENDPOINTS = {
  AUTH: {
    SIGN_IN: '/auth/signin',
    SIGN_UP: '/auth/signup',
    SIGN_OUT: '/auth/logout',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    USERS: '/auth/users',
    UPDATE_ROLE: (id: string) => `/auth/users/${id}/role`,
    DELETE_USER: (id: string) => `/auth/users/${id}`,
  },
  LANDMARKS: {
    LIST: '/landmarks',
    FEATURED: '/landmarks',
    AUDIO_SAMPLE: '/sync/bundle',
    FAQS: '/landmarks/faqs',
    GET_BY_ID: (id: string) => `/landmarks/${id}`,
    GET_FLOORS: (code?: string) =>
      code ? `/sync/floors?landmark=${encodeURIComponent(code)}` : '/sync/floors',
    GET_VIEWPOINTS: (floorId: string) => `/viewpoints?floorId=${floorId}`,
    GET_TOURS: (code?: string) =>
      code ? `/sync/bundle?landmark=${encodeURIComponent(code)}` : '/sync/bundle',
  },
  VIEWPOINTS: {
    LIST: '/viewpoints',
    GET_BY_ID: (id: string) => `/viewpoints/${id}`,
    CREATE: '/viewpoints',
    UPDATE: (id: string) => `/viewpoints/${id}`,
    DELETE: (id: string) => `/viewpoints/${id}`,
  },
  AUDIO: {
    LIST: '/audio',
    GET_BY_ID: (id: string) => `/audio/${id}`,
  },
  TICKETS: {
    VALIDATE: '/tickets/validate',
    LIST: '/tickets',
    GET_BY_ID: (id: string) => `/tickets/${id}`,
  },
  FLOORS: {
    LIST: '/floors',
    GET_BY_ID: (id: string) => `/floors/${id}`,
    CREATE: '/floors',
    UPDATE: (id: string) => `/floors/${id}`,
    DELETE: (id: string) => `/floors/${id}`,
  },
  SYNC: {
    MANIFEST: '/sync/manifest',
    BUNDLE: '/sync/bundle',
    FLOORS: '/sync/floors',
    LANGUAGES: '/sync/languages',
  },
  PARK_CONFIG: {
    GET: '/park/config',
  },
  HEALTH: '/health',
} as const;

export default ENDPOINTS;
