import { apiClient } from './client';
import type { Notification } from '@/types/academic.types';
import type { PageResponse } from '@/types/common.types';

// All backend responses are ApiResponse-wrapped ({ success, message, data }).
// Unwrap to the inner payload so callers get the Page / entity directly.
const unwrap = (r: any) => r.data?.data ?? r.data;

export const notificationsApi = {
  list: (page = 0, size = 20): Promise<PageResponse<Notification>> =>
    apiClient
      .get('/api/v1/notifications', { params: { page, size } })
      .then(unwrap),

  getUnreadCount: (): Promise<number> =>
    apiClient.get('/api/v1/notifications/unread-count').then(unwrap),

  markRead: (id: number) =>
    apiClient.patch(`/api/v1/notifications/${id}/read`).then(unwrap),

  registerDevice: (data: { fcmToken: string; deviceType: string; deviceName: string }) =>
    apiClient.post('/api/v1/notifications/device', data).then(unwrap),

  listSent: (page = 0, size = 50): Promise<PageResponse<SentBroadcast>> =>
    apiClient
      .get('/api/v1/notifications/sent', { params: { page, size } })
      .then(unwrap),
};

export interface SentBroadcast {
  id: number;
  title: string;
  body: string;
  type: string;
  audience: string;
  classId?: number;
  className?: string;
  recipientCount: number;
  sentByName?: string;
  sentAt: string;
}

export const broadcastApi = {
  send: (data: {
    title: string;
    body: string;
    type: string;
    audience?: string;
    classId?: number;
    sectionId?: number;
    studentId?: number;
    feeType?: string;
    scheduledAt?: string;      // ISO local date-time; future → scheduled
    attachmentUrl?: string;
    attachmentName?: string;
  }) => apiClient.post('/api/v1/notifications/broadcast', data).then((r) => r.data?.message ?? r.data),
};
