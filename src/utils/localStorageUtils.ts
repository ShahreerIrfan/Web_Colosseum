import type { UserPayload } from '@/types/api/authTypes';

const STORAGE_KEY = 'colosseum_user_payload';
const TOKEN_KEY = 'colosseum_auth_token';

export const setUserPayload = (userPayload: UserPayload | undefined): void => {
  if (!userPayload) {
    throw new Error('Invalid user data. Please try logging in again.');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userPayload));
  if (userPayload.token) {
    localStorage.setItem(TOKEN_KEY, userPayload.token);
  }
};

export const getUserPayload = (): UserPayload => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    throw new Error('User not found. Please sign in again.');
  }
  return JSON.parse(data) as UserPayload;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeUserPayload = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data !== null;
  } catch {
    return false;
  }
};
