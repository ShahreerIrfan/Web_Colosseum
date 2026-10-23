export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'USER'
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'user'
  | string;

export interface RbacItem {
  'module name': string;
  Create: 'true' | 'false';
  Read: 'true' | 'false';
  Update: 'true' | 'false';
  Delete: 'true' | 'false';
}

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userRole?: string;
  rback?: RbacItem[];
  avatar?: string;
  token?: string;
  assignedFloorIds?: string[];
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPayload;
  accessToken?: string;
  token?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER' | string;
  assignedFloorIds?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
