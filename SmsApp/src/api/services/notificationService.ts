import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, PageResponse, AppNotification } from '@app-types/index';

export const notificationService = {
  getNotifications: async (
    page = 0,
    size = 20,
  ): Promise<PageResponse<AppNotification>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AppNotification>>>(
      ENDPOINTS.NOTIFICATIONS,
      { params: { page, size } },
    );
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>(
      ENDPOINTS.UNREAD_COUNT,
    );
    return res.data.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(ENDPOINTS.MARK_READ(id));
  },

  registerFcmToken: async (
    fcmToken: string,
    deviceType: string,
    deviceName: string,
  ): Promise<void> => {
    await apiClient.post('/notifications/device', {
      fcmToken,
      deviceType,
      deviceName,
    });
  },
};
