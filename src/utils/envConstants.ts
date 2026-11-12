interface RuntimeEnv {
  VITE_BACKEND_URL?: string;
  VITE_FRONTEND_URL?: string;
  VITE_PRIVACY_OPERATOR?: string;
  VITE_PRIVACY_CONTACT_EMAIL?: string;
}

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

const runtimeEnv: RuntimeEnv = typeof window !== 'undefined' ? window.__ENV__ || {} : {};
const buildEnv = import.meta.env;
const defaultBackendUrl = 'http://187.126.3.18:9000/api/v1';

const readEnv = (key: keyof RuntimeEnv): string => {
  const runtimeVal = runtimeEnv[key]?.trim();
  if (runtimeVal) return runtimeVal;
  const buildVal = (buildEnv[key] as string | undefined)?.trim();
  return buildVal || '';
};

const rawBackendUrl = (readEnv('VITE_BACKEND_URL') || defaultBackendUrl).replace(/\/+$/, '');
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
  FRONTEND_URL: readEnv('VITE_FRONTEND_URL') || 'http://localhost:5173',
  PRIVACY_OPERATOR: readEnv('VITE_PRIVACY_OPERATOR'),
  PRIVACY_CONTACT_EMAIL: readEnv('VITE_PRIVACY_CONTACT_EMAIL'),
};

export default EnvConstants;
