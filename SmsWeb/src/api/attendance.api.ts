import { apiClient } from './client';
import type { MarkAttendanceRequest } from '@/types/academic.types';

const unwrap = (r: any) => r.data?.data ?? r.data;

export const attendanceApi = {
  markAttendance: (data: MarkAttendanceRequest) =>
    apiClient.post('/api/v1/attendance/mark', data).then(unwrap),

  getBySection: (sectionId: number, date: string) =>
    apiClient.get(`/api/v1/attendance/section/${sectionId}`, { params: { date } }).then(unwrap),

  getByStudent: (studentId: number, from: string, to: string) =>
    apiClient.get(`/api/v1/attendance/student/${studentId}`, { params: { from, to } }).then(unwrap),

  getPercentage: (studentId: number, from: string, to: string) =>
    apiClient.get(`/api/v1/attendance/student/${studentId}/percentage`, { params: { from, to } }).then(unwrap),

  // Roster of students enrolled in a section (sorted by roll)
  getSectionStudents: (sectionId: number) =>
    apiClient.get(`/api/v1/admin/sections/${sectionId}/students`).then(unwrap),
};
