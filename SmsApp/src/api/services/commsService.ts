import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, PageResponse, Circular } from '@app-types/index';

export interface SchoolEventItem {
  id: number;
  title: string;
  description?: string;
  eventDate?: string;
  venue?: string;
}

export const commsService = {
  // Circulars
  getCirculars: async (page = 0, size = 20): Promise<PageResponse<Circular>> =>
    (await apiClient.get<ApiResponse<PageResponse<Circular>>>(ENDPOINTS.CIRCULARS, { params: { page, size } })).data.data,
  createCircular: async (params: { title: string; content: string; publish?: boolean }): Promise<Circular> =>
    (await apiClient.post<ApiResponse<Circular>>(ENDPOINTS.CIRCULARS_CREATE, null, { params })).data.data,

  // Events
  getEvents: async (page = 0, size = 20): Promise<PageResponse<SchoolEventItem>> =>
    (await apiClient.get<ApiResponse<PageResponse<SchoolEventItem>>>(ENDPOINTS.EVENTS, { params: { page, size } })).data.data,
  createEvent: async (params: { title: string; description?: string; eventDate: string; venue?: string; publish?: boolean }): Promise<SchoolEventItem> =>
    (await apiClient.post<ApiResponse<SchoolEventItem>>(ENDPOINTS.EVENTS_CREATE, null, { params })).data.data,
};
