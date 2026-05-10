import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, ExamResult } from '@app-types/index';

export const examService = {
  getResults: async (studentId: number): Promise<ExamResult[]> => {
    const res = await apiClient.get<ApiResponse<ExamResult[]>>(
      ENDPOINTS.RESULTS(studentId),
    );
    return res.data.data;
  },
};
