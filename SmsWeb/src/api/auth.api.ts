import { apiClient } from './client';
import type { LoginRequest, AuthResponse, RefreshTokenRequest } from '@/types/auth.types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post('/api/v1/auth/login', data).then((r: any) => r.data?.data ?? r.data),

  refresh: (data: RefreshTokenRequest) =>
    apiClient.post('/api/v1/auth/refresh', data).then((r: any) => r.data?.data ?? r.data),

  logout: () => apiClient.post('/api/v1/auth/logout'),

  forgotPassword: (identifier: string): Promise<string> =>
    apiClient.post('/api/v1/auth/forgot-password', { identifier })
      .then((r: any) => r.data?.message ?? 'If an account exists, a temporary password has been emailed.'),
};
