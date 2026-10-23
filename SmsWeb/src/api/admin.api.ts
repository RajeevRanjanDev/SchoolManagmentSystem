import { apiClient } from './client';

// ── Classes ──────────────────────────────────────────────────────────────────

export interface CreateClassRequest {
  name: string;
  numericName?: number;
  academicYear: string;
}

export const classesApi = {
  list: (academicYear?: string) =>
    apiClient.get('/api/v1/admin/classes', { params: { academicYear } }).then((r) => r.data?.data ?? r.data),

  create: (data: CreateClassRequest) =>
    apiClient.post('/api/v1/admin/classes', data).then((r) => r.data?.data ?? r.data),

  update: (id: number, data: CreateClassRequest) =>
    apiClient.put(`/api/v1/admin/classes/${id}`, data).then((r) => r.data?.data ?? r.data),

  setStatus: (id: number, status: 'ACTIVE' | 'INACTIVE') =>
    apiClient.patch(`/api/v1/admin/classes/${id}/status`, null, { params: { status } }).then((r) => r.data?.data ?? r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/v1/admin/classes/${id}`),
};

// ── Sections ─────────────────────────────────────────────────────────────────

export interface CreateSectionRequest {
  name: string;
  maxCapacity?: number;
  classTeacherId?: number;
}

export interface SectionImpact {
  studentCount: number;
  hasStudents: boolean;
  canDelete: boolean;
}

export const sectionsApi = {
  listByClass: (classId: number) =>
    apiClient.get(`/api/v1/admin/classes/${classId}/sections`).then((r) => r.data?.data ?? r.data),

  listAll: () =>
    apiClient.get('/api/v1/admin/sections').then((r) => r.data?.data ?? r.data),

  create: (classId: number, data: CreateSectionRequest) =>
    apiClient.post(`/api/v1/admin/classes/${classId}/sections`, data).then((r) => r.data?.data ?? r.data),

  update: (sectionId: number, data: CreateSectionRequest) =>
    apiClient.put(`/api/v1/admin/sections/${sectionId}`, data).then((r) => r.data?.data ?? r.data),

  setStatus: (sectionId: number, status: 'ACTIVE' | 'INACTIVE') =>
    apiClient.patch(`/api/v1/admin/sections/${sectionId}/status`, null, { params: { status } }).then((r) => r.data?.data ?? r.data),

  impact: (sectionId: number): Promise<SectionImpact> =>
    apiClient.get(`/api/v1/admin/sections/${sectionId}/impact`).then((r) => r.data?.data ?? r.data),

  delete: (sectionId: number) =>
    apiClient.delete(`/api/v1/admin/sections/${sectionId}`),
};

// ── Subjects ─────────────────────────────────────────────────────────────────

export interface CreateSubjectRequest {
  subjectName: string;
  subjectCode: string;
  description?: string;
  status?: string;
}

export const subjectsApi = {
  list: () =>
    apiClient.get('/api/v1/admin/subjects').then((r) => r.data?.data ?? r.data),

  create: (data: CreateSubjectRequest) =>
    apiClient.post('/api/v1/admin/subjects', data).then((r) => r.data?.data ?? r.data),

  update: (id: number, data: CreateSubjectRequest) =>
    apiClient.put(`/api/v1/admin/subjects/${id}`, data).then((r) => r.data?.data ?? r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/v1/admin/subjects/${id}`),
};
