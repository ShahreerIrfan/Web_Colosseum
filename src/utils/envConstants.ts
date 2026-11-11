const Environment = import.meta.env;
const defaultBackendUrl = 'http://187.126.3.18:3000/api/v1';

const rawBackendUrl = (Environment.VITE_BACKEND_URL || defaultBackendUrl).replace(/\/+$/, '');
const normalizedBackendUrl = rawBackendUrl.endsWith('/api/v1')
  ? rawBackendUrl
  : `${rawBackendUrl}/api/v1`;
const useSameOriginApi =
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  normalizedBackendUrl === defaultBackendUrl;

const EnvConstants = {
  BACKEND_URL: useSameOriginApi ? '/api/v1' : normalizedBackendUrl,
  FRONTEND_URL: Environment.VITE_FRONTEND_URL || 'http://localhost:5173',
};

export default EnvConstants;
