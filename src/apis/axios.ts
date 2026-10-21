import EnvConstants from '@/utils/envConstants';
import { getAuthToken } from '@/utils/localStorageUtils';
import axios from 'axios';

const api = axios.create({
  baseURL: EnvConstants.BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
