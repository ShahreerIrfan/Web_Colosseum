const Environment = import.meta.env;

const EnvConstants = {
  BACKEND_URL: Environment.VITE_BACKEND_URL || 'http://187.126.3.18:3000/api/v1',
  FRONTEND_URL: Environment.VITE_FRONTEND_URL || 'http://localhost:5173',
};

export default EnvConstants;
