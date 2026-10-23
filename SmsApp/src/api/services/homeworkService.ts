import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, Homework } from '@app-types/index';

export const homeworkService = {
  getHomeworkBySection: async (sectionId: number): Promise<Homework[]> => {
    const res = await apiClient.get<ApiResponse<Homework[]>>(
      ENDPOINTS.HOMEWORK_BY_SECTION(sectionId),
    );
    return res.data.data;
  },

  getAllHomework: async (): Promise<Homework[]> => {
    const res = await apiClient.get<ApiResponse<Homework[]>>(ENDPOINTS.HOMEWORK);
    return res.data.data;
  },
};
