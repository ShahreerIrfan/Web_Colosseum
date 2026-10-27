const Environment = import.meta.env;

const rawBackendUrl = (Environment.VITE_BACKEND_URL || 'http://187.126.3.18:3000/api/v1').replace(
  /\/+$/,
  ''
);
const normalizedBackendUrl = rawBackendUrl.endsWith('/api/v1')
  ? rawBackendUrl
  : `${rawBackendUrl}/api/v1`;

const EnvConstants = {
  BACKEND_URL: normalizedBackendUrl,
  FRONTEND_URL: Environment.VITE_FRONTEND_URL || 'http://localhost:5173',
};

export default EnvConstants;
