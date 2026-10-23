import { apiClient } from './client';
import type { Homework, Exam, ExamResult, TimetableEntry } from '@/types/academic.types';

export const homeworkApi = {
  create: (data: {
    sectionId: number;
    subject: string;
    title: string;
    description: string;
    dueDate: string;
  }) => apiClient.post<Homework>('/api/v1/homework', data).then((r) => r.data),

  getBySection: (sectionId: number, from?: string, to?: string) =>
    apiClient
      .get<Homework[]>(`/api/v1/homework/section/${sectionId}`, { params: { from, to } })
      .then((r) => r.data),
};

export const examsApi = {
  schedule: (params: {
    sectionId: number;
    examName: string;
    subject: string;
    examDate: string;
    totalMarks: number;
    academicYear: string;
  }) => apiClient.post<Exam>('/api/v1/exams', null, { params }).then((r) => r.data),

  getBySection: (sectionId: number, academicYear?: string) =>
    apiClient
      .get<Exam[]>(`/api/v1/exams/section/${sectionId}`, { params: { academicYear } })
      .then((r) => r.data),

  uploadResult: (params: {
    examId: number;
    studentId: number;
    marksObtained: number;
    grade: string;
  }) => apiClient.post<ExamResult>('/api/v1/exams/results', null, { params }).then((r) => r.data),

  getStudentResults: (studentId: number) =>
    apiClient.get<ExamResult[]>(`/api/v1/exams/results/student/${studentId}`).then((r) => r.data),

  publishResult: (resultId: number) =>
    apiClient.patch(`/api/v1/exams/results/${resultId}/publish`).then((r) => r.data),
};

export const timetableApi = {
  create: (params: {
    sectionId: number;
    teacherId: number;
    subject: string;
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
    academicYear: string;
  }) => apiClient.post<TimetableEntry>('/api/v1/timetable', null, { params }).then((r) => r.data),

  getBySection: (sectionId: number, academicYear?: string) =>
    apiClient
      .get<TimetableEntry[]>(`/api/v1/timetable/section/${sectionId}`, { params: { academicYear } })
      .then((r) => r.data),

  getByTeacher: (teacherId: number, academicYear?: string) =>
    apiClient
      .get<TimetableEntry[]>(`/api/v1/timetable/teacher/${teacherId}`, { params: { academicYear } })
      .then((r) => r.data),
};
