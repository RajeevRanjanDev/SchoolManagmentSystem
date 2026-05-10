import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, LoginRequest, AuthResponse } from '@app-types/index';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.LOGIN,
      data,
    );
    return res.data.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.REFRESH,
      { refreshToken },
    );
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.LOGOUT);
  },
};
