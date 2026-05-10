import { apiClient } from './client';
import type { ApiResponse, ScheduleExamRequest, UploadResultRequest } from '../types/api';
import type { Exam, ExamResult } from '../types';

export const examsApi = {
  scheduleExam: async (data: ScheduleExamRequest): Promise<Exam> => {
    const res = await apiClient.post<ApiResponse<Exam>>('/exams', null, {
      params: {
        sectionId: data.sectionId,
        examName: data.examName,
        subject: data.subject,
        examDate: data.examDate,
        totalMarks: data.totalMarks,
        academicYear: data.academicYear,
      },
    });
    return res.data.data;
  },

  getBySection: async (sectionId: number, academicYear: string): Promise<Exam[]> => {
    const res = await apiClient.get<ApiResponse<Exam[]>>(
      `/exams/section/${sectionId}`,
      { params: { academicYear } },
    );
    return res.data.data;
  },

  uploadResult: async (data: UploadResultRequest): Promise<ExamResult> => {
    const res = await apiClient.post<ApiResponse<ExamResult>>('/exams/results', null, {
      params: {
        examId: data.examId,
        studentId: data.studentId,
        marksObtained: data.marksObtained,
        grade: data.grade,
      },
    });
    return res.data.data;
  },

  getStudentResults: async (studentId: number): Promise<ExamResult[]> => {
    const res = await apiClient.get<ApiResponse<ExamResult[]>>(
      `/exams/results/student/${studentId}`,
    );
    return res.data.data;
  },

  publishResult: async (resultId: number): Promise<void> => {
    await apiClient.patch(`/exams/results/${resultId}/publish`);
  },
};
