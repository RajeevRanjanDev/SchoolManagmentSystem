import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, TimetablePeriod } from '@app-types/index';

export const timetableService = {
  getTimetable: async (sectionId: number): Promise<TimetablePeriod[]> => {
    const res = await apiClient.get<ApiResponse<TimetablePeriod[]>>(
      ENDPOINTS.TIMETABLE(sectionId),
    );
    return res.data.data;
  },
};
