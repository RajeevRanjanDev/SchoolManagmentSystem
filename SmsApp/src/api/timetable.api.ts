import { apiClient } from './client';
import type { ApiResponse, CreateTimetableRequest } from '../types/api';
import type { TimetableEntry } from '../types';

export const timetableApi = {
  createEntry: async (data: CreateTimetableRequest): Promise<TimetableEntry> => {
    const res = await apiClient.post<ApiResponse<TimetableEntry>>('/timetable', null, {
      params: {
        sectionId: data.sectionId,
        teacherId: data.teacherId,
        subject: data.subject,
        dayOfWeek: data.dayOfWeek,
        periodNumber: data.periodNumber,
        startTime: data.startTime,
        endTime: data.endTime,
        academicYear: data.academicYear,
      },
    });
    return res.data.data;
  },

  getBySection: async (sectionId: number, academicYear: string): Promise<TimetableEntry[]> => {
    const res = await apiClient.get<ApiResponse<TimetableEntry[]>>(
      `/timetable/section/${sectionId}`,
      { params: { academicYear } },
    );
    return res.data.data;
  },

  getByTeacher: async (teacherId: number, academicYear: string): Promise<TimetableEntry[]> => {
    const res = await apiClient.get<ApiResponse<TimetableEntry[]>>(
      `/timetable/teacher/${teacherId}`,
      { params: { academicYear } },
    );
    return res.data.data;
  },
};
