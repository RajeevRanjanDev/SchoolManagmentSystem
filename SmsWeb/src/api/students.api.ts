import { apiClient } from './client';
import type { Student, CreateStudentRequest, UpdateStudentRequest } from '@/types/student.types';
import type { PageResponse } from '@/types/common.types';

const unwrap = (r: any) => r.data?.data ?? r.data;

export const studentsApi = {
  list: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<Student>>('/api/v1/students', { params: { page, size } })
      .then(unwrap),

  get: (id: number) => apiClient.get<Student>(`/api/v1/students/${id}`).then(unwrap),

  create: (data: CreateStudentRequest) =>
    apiClient.post<Student>('/api/v1/students', data).then(unwrap),

  update: (id: number, data: UpdateStudentRequest) =>
    apiClient.put<Student>(`/api/v1/students/${id}`, data).then(unwrap),

  toggleStatus: (id: number, active: boolean) =>
    apiClient.patch(`/api/v1/students/${id}/status`, null, { params: { active } }).then(unwrap),

  delete: (id: number) => apiClient.delete(`/api/v1/students/${id}`),

  byParent: (parentId: number) =>
    apiClient.get<Student[]>(`/api/v1/students/by-parent/${parentId}`).then(unwrap),

  enroll: (studentId: number, data: { classId: number; sectionId: number; academicYear: string; rollNumber?: string }) =>
    apiClient.post(`/api/v1/students/${studentId}/enroll`, data).then(unwrap),
};
