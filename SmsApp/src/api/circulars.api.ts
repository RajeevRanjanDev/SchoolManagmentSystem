import { apiClient } from './client';
import { PAGE_SIZE } from '../constants';
import type { ApiResponse, CreateCircularRequest } from '../types/api';
import type { Circular, Page } from '../types';

export const circularsApi = {
  getAll: async (page = 0, size = PAGE_SIZE): Promise<Page<Circular>> => {
    const res = await apiClient.get<ApiResponse<Page<Circular>>>('/circulars', {
      params: { page, size },
    });
    return res.data.data;
  },

  create: async (data: CreateCircularRequest): Promise<Circular> => {
    const res = await apiClient.post<ApiResponse<Circular>>('/circulars', null, {
      params: {
        title: data.title,
        content: data.content,
        publish: data.publish ?? true,
      },
    });
    return res.data.data;
  },
};
