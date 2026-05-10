export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  schoolId: number;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthUser {
  userId: number;
  schoolId: number;
  email: string;
  fullName: string;
  roles: string[];
  avatarUrl?: string;
}
