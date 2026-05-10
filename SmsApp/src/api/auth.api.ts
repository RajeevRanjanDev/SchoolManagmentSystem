import { apiClient } from './client';
import type { ApiResponse, LoginRequest, AuthResponse, RegisterDeviceRequest } from '../types/api';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken,
    });
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  registerDevice: async (data: RegisterDeviceRequest): Promise<void> => {
    await apiClient.post('/notifications/device', data);
  },
};
