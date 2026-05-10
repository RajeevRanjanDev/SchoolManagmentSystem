import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, PageResponse, Student, DashboardStats } from '@app-types/index';

export const studentService = {
  getMyStudents: async (): Promise<Student[]> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Student>>>(
      ENDPOINTS.STUDENTS,
      { params: { page: 0, size: 50 } },
    );
    return res.data.data.content;
  },

  getStudentById: async (id: number): Promise<Student> => {
    const res = await apiClient.get<ApiResponse<Student>>(
      ENDPOINTS.STUDENT_BY_ID(id),
    );
    return res.data.data;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>(
      ENDPOINTS.DASHBOARD,
    );
    return res.data.data;
  },
};
