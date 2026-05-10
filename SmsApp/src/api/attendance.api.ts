import { apiClient } from './client';
import type { ApiResponse, MarkAttendanceRequest } from '../types/api';
import type { AttendanceRecord } from '../types';

export const attendanceApi = {
  markAttendance: async (data: MarkAttendanceRequest): Promise<void> => {
    await apiClient.post('/attendance/mark', data);
  },

  getBySection: async (sectionId: number, date: string): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      `/attendance/section/${sectionId}`,
      { params: { date } },
    );
    return res.data.data;
  },

  getByStudent: async (
    studentId: number,
    from: string,
    to: string,
  ): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      `/attendance/student/${studentId}`,
      { params: { from, to } },
    );
    return res.data.data;
  },

  getStudentPercentage: async (
    studentId: number,
    from: string,
    to: string,
  ): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>(
      `/attendance/student/${studentId}/percentage`,
      { params: { from, to } },
    );
    return res.data.data;
  },
};
