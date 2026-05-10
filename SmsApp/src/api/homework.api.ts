import { apiClient } from './client';
import type { ApiResponse, CreateHomeworkRequest } from '../types/api';
import type { Homework } from '../types';

export const homeworkApi = {
  assign: async (data: CreateHomeworkRequest): Promise<Homework> => {
    const res = await apiClient.post<ApiResponse<Homework>>('/homework', data);
    return res.data.data;
  },

  getBySectionId: async (
    sectionId: number,
    from?: string,
    to?: string,
  ): Promise<Homework[]> => {
    const res = await apiClient.get<ApiResponse<Homework[]>>(
      `/homework/section/${sectionId}`,
      { params: { from, to } },
    );
    return res.data.data;
  },
};
