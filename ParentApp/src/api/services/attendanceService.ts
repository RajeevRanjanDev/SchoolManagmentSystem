import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, AttendanceRecord } from '@app-types/index';

export const attendanceService = {
  getStudentAttendance: async (
    studentId: number,
    from: string,
    to: string,
  ): Promise<AttendanceRecord[]> => {
    const res = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      ENDPOINTS.STUDENT_ATTENDANCE(studentId),
      { params: { from, to } },
    );
    return res.data.data;
  },

  getAttendancePercentage: async (
    studentId: number,
    from: string,
    to: string,
  ): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>(
      ENDPOINTS.ATTENDANCE_PERCENTAGE(studentId),
      { params: { from, to } },
    );
    return res.data.data;
  },
};
