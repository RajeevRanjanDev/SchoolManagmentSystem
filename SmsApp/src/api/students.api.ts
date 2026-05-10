import { apiClient } from './client';
import { PAGE_SIZE } from '../constants';
import type { ApiResponse, CreateStudentRequest } from '../types/api';
import type { Student, Page } from '../types';

export const studentsApi = {
  getAll: async (page = 0, size = PAGE_SIZE): Promise<Page<Student>> => {
    const res = await apiClient.get<ApiResponse<Page<Student>>>('/students', {
      params: { page, size },
    });
    return res.data.data;
  },

  getById: async (id: number): Promise<Student> => {
    const res = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data;
  },

  getByParent: async (parentId: number): Promise<Student[]> => {
    const res = await apiClient.get<ApiResponse<Student[]>>(`/students/by-parent/${parentId}`);
    return res.data.data;
  },

  create: async (data: CreateStudentRequest): Promise<Student> => {
    const res = await apiClient.post<ApiResponse<Student>>('/students', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<CreateStudentRequest>): Promise<Student> => {
    const res = await apiClient.put<ApiResponse<Student>>(`/students/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};
