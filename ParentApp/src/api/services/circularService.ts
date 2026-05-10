import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, PageResponse, Circular } from '@app-types/index';

export const circularService = {
  getCirculars: async (page = 0, size = 20): Promise<PageResponse<Circular>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Circular>>>(
      ENDPOINTS.CIRCULARS,
      { params: { page, size } },
    );
    return res.data.data;
  },

  getCircularById: async (id: number): Promise<Circular> => {
    const res = await apiClient.get<ApiResponse<Circular>>(
      ENDPOINTS.CIRCULAR_BY_ID(id),
    );
    return res.data.data;
  },
};
