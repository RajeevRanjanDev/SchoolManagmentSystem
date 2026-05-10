import { apiClient } from './client';
import { PAGE_SIZE } from '../constants';
import type { ApiResponse } from '../types/api';
import type { AppNotification, Page } from '../types';

export const notificationsApi = {
  getAll: async (page = 0, size = PAGE_SIZE): Promise<Page<AppNotification>> => {
    const res = await apiClient.get<ApiResponse<Page<AppNotification>>>('/notifications', {
      params: { page, size },
    });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>('/notifications/unread-count');
    return res.data.data;
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },
};
