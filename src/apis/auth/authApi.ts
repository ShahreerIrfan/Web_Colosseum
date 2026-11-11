import api from '@/apis/axios';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import type {
  AuthResponse,
  ManagedUser,
  SignInRequest,
  SignUpRequest,
  UserPayload,
} from '@/types/api/authTypes';
import { ENDPOINTS } from '@/utils/endPoints';
import { setAuthToken } from '@/utils/localStorageUtils';

interface BackendAuthRaw {
  user: UserPayload;
  token?: string;
  accessToken?: string;
}

async function authenticate(
  endpoint: string,
  payload: SignInRequest | SignUpRequest
): Promise<AuthResponse> {
  const { data } = await api.post<
    BaseSuccessResponse<BackendAuthRaw> & { payload?: BackendAuthRaw }
  >(endpoint, payload);
  const raw = data.data ?? data.payload;
  const token = raw?.token ?? raw?.accessToken;
  if (!raw?.user || !token) throw new Error('The server did not return a signed session.');
  setAuthToken(token);
  return { user: { ...raw.user, token }, accessToken: token, token };
}

export const authApi = {
  signIn: (payload: SignInRequest): Promise<AuthResponse> =>
    authenticate(ENDPOINTS.AUTH.SIGN_IN, payload),

  signUp: (payload: SignUpRequest): Promise<AuthResponse> =>
    authenticate(ENDPOINTS.AUTH.SIGN_UP, payload),

  signOut: async (): Promise<void> => {
    try {
      await api.post(ENDPOINTS.AUTH.SIGN_OUT);
    } catch {
      // Ignore network errors on sign out
    }
  },

  getMe: async (): Promise<UserPayload> => {
    const response = await api.get<BaseSuccessResponse<UserPayload>>(ENDPOINTS.AUTH.PROFILE);
    return response.data.data || (response.data as unknown as { payload: UserPayload }).payload;
  },

  getAllUsers: async (): Promise<ManagedUser[]> => {
    const users = new Map<string, ManagedUser>();
    for (let page = 1; ; page++) {
      const response = await api.get<BaseSuccessResponse<{ users: ManagedUser[]; total: number }>>(
        ENDPOINTS.AUTH.USERS,
        { params: { page, limit: 100 } }
      );
      const result = response.data.data;
      const previousSize = users.size;
      for (const user of result.users) users.set(user.id, user);
      if (users.size >= result.total || users.size === previousSize) return [...users.values()];
    }
  },

  createUser: async (
    payload: SignInRequest & { name?: string; role?: string }
  ): Promise<ManagedUser> => {
    const { data } = await api.post<BaseSuccessResponse<ManagedUser>>(
      ENDPOINTS.AUTH.USERS,
      payload
    );
    return data.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<ManagedUser> => {
    const { data } = await api.patch<BaseSuccessResponse<ManagedUser>>(
      ENDPOINTS.AUTH.UPDATE_ROLE(userId),
      { role }
    );
    return data.data;
  },

  updateUserDetails: async (
    userId: string,
    changes: Partial<ManagedUser>
  ): Promise<ManagedUser> => {
    const { data } = await api.put<BaseSuccessResponse<ManagedUser>>(
      `/auth/users/${userId}`,
      changes
    );
    return data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(ENDPOINTS.AUTH.DELETE_USER(userId));
  },
};

export default authApi;
