import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface Exam {
  id: number;
  examName: string;
  subject?: string;
  examDate: string;
  totalMarks: number;
  academicYear: string;
}

export interface ExamResult {
  id: number;
  marksObtained: number;
  grade?: string;
  published: boolean;
  student?: { id: number };
  exam?: { id: number };
}

export const examsApi = {
  listBySection: (sectionId: number, academicYear: string): Promise<Exam[]> =>
    apiClient.get(`/api/v1/exams/section/${sectionId}`, { params: { academicYear } }).then(unwrap),

  schedule: (params: { sectionId: number; examName: string; examDate: string; totalMarks?: number; academicYear: string }) =>
    apiClient.post('/api/v1/exams', null, { params }).then(unwrap),

  deleteExam: (examId: number) =>
    apiClient.delete(`/api/v1/exams/${examId}`),

  getExamResults: (examId: number): Promise<any[]> =>
    apiClient.get(`/api/v1/exams/${examId}/results`).then(unwrap),

  bulkUpload: (examId: number, results: { studentId: number; marksObtained: number; grade?: string }[]) =>
    apiClient.post(`/api/v1/exams/${examId}/results/bulk`, { results }).then(unwrap),
};
