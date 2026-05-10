import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, PageResponse, SchoolEvent } from '@app-types/index';

export const eventService = {
  getEvents: async (page = 0, size = 20): Promise<PageResponse<SchoolEvent>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<SchoolEvent>>>(
      ENDPOINTS.EVENTS,
      { params: { page, size } },
    );
    return res.data.data;
  },
};
