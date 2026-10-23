import { apiClient } from './client';

export type EmployeeRole = 'TEACHER' | 'ACCOUNTANT' | 'TRANSPORT_MANAGER' | 'SCHOOL_ADMIN' | 'SUPPORT_STAFF';

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  employeeCode?: string;
  role?: EmployeeRole;
  mobile?: string;
  qualification?: string;
  specialization?: string;
  joiningDate: string;
  experienceYears?: number;
  photoUrl?: string;
  status?: string;
}

export const EMPLOYEE_ROLES: { value: EmployeeRole; label: string }[] = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ACCOUNTANT', label: 'Accountant (Finance)' },
  { value: 'TRANSPORT_MANAGER', label: 'Transport Manager' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff (no fees/reconciliation)' },
  { value: 'SCHOOL_ADMIN', label: 'School Admin' },
];

export const ROLE_LABEL: Record<string, string> = {
  TEACHER: 'Teacher',
  ACCOUNTANT: 'Accountant',
  TRANSPORT_MANAGER: 'Transport',
  SUPPORT_STAFF: 'Support Staff',
  SCHOOL_ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

export interface AssignTeacherRequest {
  classId: number;
  sectionId: number;
  subjectId: number;
  academicYear: string;
  isClassTeacher?: boolean;
}

export const teachersApi = {
  list: () =>
    apiClient.get('/api/v1/admin/teachers').then((r) => r.data?.data ?? r.data),

  get: (id: number) =>
    apiClient.get(`/api/v1/admin/teachers/${id}`).then((r) => r.data?.data ?? r.data),

  create: (data: CreateTeacherRequest) =>
    apiClient.post('/api/v1/admin/teachers', data).then((r) => r.data?.data ?? r.data),

  update: (id: number, data: CreateTeacherRequest) =>
    apiClient.put(`/api/v1/admin/teachers/${id}`, data).then((r) => r.data?.data ?? r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.patch(`/api/v1/admin/teachers/${id}/status`, null, { params: { status } }).then((r) => r.data?.data ?? r.data),

  resetPassword: (id: number): Promise<string> =>
    apiClient.post(`/api/v1/admin/teachers/${id}/reset-password`).then((r) => r.data?.message ?? 'Temporary password emailed'),

  delete: (id: number) =>
    apiClient.delete(`/api/v1/admin/teachers/${id}`),

  getAssignments: (teacherId: number, academicYear?: string) =>
    apiClient.get(`/api/v1/admin/teachers/${teacherId}/assignments`, { params: { academicYear } }).then((r) => r.data?.data ?? r.data),

  assign: (teacherId: number, data: AssignTeacherRequest) =>
    apiClient.post(`/api/v1/admin/teachers/${teacherId}/assignments`, data).then((r) => r.data?.data ?? r.data),

  removeAssignment: (assignmentId: number) =>
    apiClient.delete(`/api/v1/admin/assignments/${assignmentId}`),

  setClassTeacher: (assignmentId: number, isClassTeacher: boolean) =>
    apiClient.patch(`/api/v1/admin/assignments/${assignmentId}/class-teacher`, null, { params: { isClassTeacher } }),
};
