import type { UserPayload } from '@/types/api/authTypes';
import { getFallbackRbacForRole } from '@/utils/rbacUtils';

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
  const parsed = JSON.parse(data) as UserPayload;

  // Auto-restore: Ensure the Primary Administrator account always maintains full SUPER_ADMIN access
  if (
    parsed.email?.toLowerCase() === 'admin@colosseumtour.it' ||
    parsed.id === 'usr_admin' ||
    parsed.id === 'usr_demo_101' ||
    parsed.name === 'Primary Administrator'
  ) {
    if (parsed.role !== 'SUPER_ADMIN' || parsed.userRole !== 'super_admin') {
      parsed.role = 'SUPER_ADMIN';
      parsed.userRole = 'super_admin';
      parsed.rback = getFallbackRbacForRole('super_admin');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('rbac-updated'));
        }
      } catch {
        // ignore
      }
    }
  }

  return parsed;
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
