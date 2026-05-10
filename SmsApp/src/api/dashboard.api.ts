import { apiClient } from './client';
import type { ApiResponse } from '../types/api';
import type { DashboardStats } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard');
    return res.data.data;
  },
};
