import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse } from '@app-types/index';

// ── Response shapes (kept loose — backend-driven) ────────────────────────────

export interface TeacherAssignment {
  id?: number;
  classId?: number;
  sectionId: number;
  className?: string;
  sectionName?: string;
  subjectId?: number;
  subjectName?: string;
  subject?: string;
  isClassTeacher?: boolean;
  academicYear?: string;
}

export interface ClassTeacherSection {
  sectionId: number;
  classId?: number;
  className?: string;
  sectionName?: string;
  studentCount?: number;
}

export interface SectionStudent {
  id: number;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  rollNumber?: string;
}

export interface SectionExam {
  id: number;
  examName: string;
  subject?: string;
  examDate?: string;
  totalMarks?: number;
}

export interface CreateExamPayload {
  sectionId: number;
  examName: string;
  subject?: string;
  examDate: string;       // yyyy-MM-dd
  totalMarks?: number;
  academicYear: string;
}

export interface ExamResultRow {
  id?: number;
  studentId: number;
  studentName?: string;
  marksObtained?: number;
  grade?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE' | 'HALF_DAY';

export interface AttendanceEntry {
  studentId: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendancePayload {
  sectionId: number;
  attendanceDate: string;   // yyyy-MM-dd
  entries: AttendanceEntry[];
}

export interface MarksEntry {
  studentId: number;
  marksObtained: number;
  grade?: string;
  remarks?: string;
}

export interface BulkMarksPayload {
  examId: number;
  entries: MarksEntry[];
}

export interface CreateAnnouncementPayload {
  classId?: number;
  sectionId?: number;
  studentId?: number;
  title: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  published?: boolean;
}

export interface TeacherAnnouncement {
  id: number;
  title: string;
  content?: string;
  className?: string;
  sectionName?: string;
  createdAt?: string;
  date?: string;
  publishedAt?: string;
}

export interface CreateHomeworkPayload {
  sectionId: number;
  subjectId?: number;
  title: string;
  description?: string;
  dueDate: string;        // yyyy-MM-dd
  academicYear?: string;
}

export interface TeacherHomework {
  id: number;
  title: string;
  subject?: string;
  description?: string;
  dueDate?: string;
  assignedDate?: string;
  submissionStatus?: string;
}

export interface CreateClassworkPayload {
  sectionId: number;
  subjectId: number;
  academicYear: string;
  topic: string;
  description?: string;
  classDate: string;   // yyyy-MM-dd
  notes?: string;
  attachmentUrl?: string;
}

export interface TeacherClasswork {
  id: number;
  topic: string;
  subjectName?: string;
  description?: string;
  classDate?: string;
  className?: string;
  sectionName?: string;
}

export interface StudentCard {
  studentId: number;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  rollNumber?: string;
  className?: string;
  sectionName?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  category?: string;
  nationality?: string;
  religion?: string;
  mobile?: string;
  email?: string;
  currentAddress?: string;
  permanentAddress?: string;
  guardians?: Array<{ relation?: string; name?: string; mobile?: string; email?: string }>;
}

export interface TimetablePeriod {
  id?: number;
  dayOfWeek?: string;
  periodNumber?: number;
  startTime?: string;
  endTime?: string;
  subject?: string;
  sectionId?: number;
  sectionName?: string;
}

export interface HomeworkSubmission {
  id: number;
  studentId?: number;
  studentName?: string;
  submissionUrl?: string;
  textResponse?: string;
  status?: string;
  submittedAt?: string;
  grade?: string;
  teacherRemarks?: string;
}

export interface ReviewSubmissionPayload {
  status: string;         // ACCEPTED | REJECTED | RESUBMIT | COMPLETED
  grade?: string;
  teacherRemarks?: string;
  reviewedFileUrl?: string;
}

export interface LessonPlan {
  id: number;
  planName?: string;
  planType?: string;
  subjectName?: string;
  className?: string;
  sectionName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  totalTopics?: number;
  completedTopics?: number;
  completionPercent?: number;
}

export interface CreateLessonPlanPayload {
  sectionId: number;
  subjectId: number;
  academicYear: string;
  planType: string;       // ANNUAL | MONTHLY | WEEKLY | DAILY
  planName?: string;
  startDate: string;
  endDate: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const teacherService = {
  getDashboard: async (academicYear?: string): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(ENDPOINTS.TEACHER_DASHBOARD, {
      params: academicYear ? { academicYear } : {},
    });
    return res.data.data;
  },

  getMyAssignments: async (academicYear?: string): Promise<TeacherAssignment[]> => {
    const res = await apiClient.get<ApiResponse<TeacherAssignment[]>>(
      ENDPOINTS.TEACHER_ASSIGNMENTS,
      { params: academicYear ? { academicYear } : {} },
    );
    return res.data.data;
  },

  getMyClassSections: async (academicYear?: string): Promise<ClassTeacherSection[]> => {
    const res = await apiClient.get<ApiResponse<ClassTeacherSection[]>>(
      ENDPOINTS.TEACHER_CLASS_SECTIONS,
      { params: academicYear ? { academicYear } : {} },
    );
    return res.data.data;
  },

  getSectionStudents: async (sectionId: number): Promise<SectionStudent[]> => {
    const res = await apiClient.get<ApiResponse<SectionStudent[]>>(
      ENDPOINTS.SECTION_STUDENTS(sectionId),
    );
    return res.data.data;
  },

  markAttendance: async (payload: BulkAttendancePayload): Promise<void> => {
    await apiClient.post(ENDPOINTS.TEACHER_ATTENDANCE, payload);
  },

  getSectionExams: async (
    sectionId: number,
    academicYear: string,
  ): Promise<SectionExam[]> => {
    const res = await apiClient.get<ApiResponse<SectionExam[]>>(
      ENDPOINTS.EXAMS_BY_SECTION(sectionId),
      { params: { academicYear } },
    );
    return res.data.data;
  },

  // Schedule a new exam. Backend reads query params (not a JSON body).
  createExam: async (payload: CreateExamPayload): Promise<SectionExam> => {
    const res = await apiClient.post<ApiResponse<SectionExam>>(
      ENDPOINTS.EXAMS,
      null,
      { params: payload },
    );
    return res.data.data;
  },

  deleteExam: async (examId: number): Promise<void> => {
    await apiClient.delete(ENDPOINTS.EXAM_BY_ID(examId));
  },

  publishExamResults: async (examId: number): Promise<number> => {
    const res = await apiClient.patch<ApiResponse<number>>(
      ENDPOINTS.EXAM_PUBLISH_ALL(examId),
    );
    return res.data.data;
  },

  getExamResults: async (examId: number): Promise<ExamResultRow[]> => {
    const res = await apiClient.get<ApiResponse<ExamResultRow[]>>(
      ENDPOINTS.EXAM_RESULTS(examId),
    );
    return res.data.data;
  },

  submitMarks: async (payload: BulkMarksPayload): Promise<void> => {
    await apiClient.post(ENDPOINTS.TEACHER_MARKS, payload);
  },

  createAnnouncement: async (
    payload: CreateAnnouncementPayload,
  ): Promise<TeacherAnnouncement> => {
    const res = await apiClient.post<ApiResponse<TeacherAnnouncement>>(
      ENDPOINTS.TEACHER_ANNOUNCEMENTS,
      payload,
    );
    return res.data.data;
  },

  getAnnouncements: async (): Promise<TeacherAnnouncement[]> => {
    const res = await apiClient.get<ApiResponse<TeacherAnnouncement[]>>(
      ENDPOINTS.TEACHER_ANNOUNCEMENTS,
    );
    return res.data.data;
  },

  createHomework: async (payload: CreateHomeworkPayload): Promise<TeacherHomework> => {
    const res = await apiClient.post<ApiResponse<TeacherHomework>>(
      ENDPOINTS.TEACHER_HOMEWORK,
      payload,
    );
    return res.data.data;
  },

  getHomework: async (sectionId: number, academicYear?: string): Promise<TeacherHomework[]> => {
    const res = await apiClient.get<ApiResponse<TeacherHomework[]>>(
      ENDPOINTS.TEACHER_HOMEWORK,
      { params: { sectionId, ...(academicYear ? { academicYear } : {}) } },
    );
    return res.data.data;
  },

  // ── Classwork ───────────────────────────────────────────────────────────────
  createClasswork: async (payload: CreateClassworkPayload): Promise<TeacherClasswork> => {
    const res = await apiClient.post<ApiResponse<TeacherClasswork>>(ENDPOINTS.TEACHER_CLASSWORK, payload);
    return res.data.data;
  },

  getClasswork: async (sectionId: number, academicYear?: string): Promise<TeacherClasswork[]> => {
    const res = await apiClient.get<ApiResponse<TeacherClasswork[]>>(ENDPOINTS.TEACHER_CLASSWORK, {
      params: { sectionId, ...(academicYear ? { academicYear } : {}) },
    });
    return res.data.data;
  },

  // ── Student directory / card ─────────────────────────────────────────────────
  getStudentCard: async (studentId: number): Promise<StudentCard> => {
    const res = await apiClient.get<ApiResponse<StudentCard>>(ENDPOINTS.TEACHER_STUDENT_CARD(studentId));
    return res.data.data;
  },

  // ── Timetable ─────────────────────────────────────────────────────────────────
  getTeacherTimetable: async (teacherId: number): Promise<TimetablePeriod[]> => {
    const res = await apiClient.get<ApiResponse<TimetablePeriod[]>>(ENDPOINTS.TIMETABLE_TEACHER(teacherId));
    return res.data.data;
  },

  // ── Homework submissions review ─────────────────────────────────────────────
  getHomeworkSubmissions: async (homeworkId: number): Promise<HomeworkSubmission[]> => {
    const res = await apiClient.get<ApiResponse<HomeworkSubmission[]>>(ENDPOINTS.HOMEWORK_SUBMISSIONS(homeworkId));
    return res.data.data;
  },

  reviewSubmission: async (submissionId: number, payload: ReviewSubmissionPayload): Promise<HomeworkSubmission> => {
    const res = await apiClient.patch<ApiResponse<HomeworkSubmission>>(ENDPOINTS.HOMEWORK_REVIEW(submissionId), payload);
    return res.data.data;
  },

  // ── Lesson plans ──────────────────────────────────────────────────────────────
  getLessonPlans: async (academicYear?: string): Promise<LessonPlan[]> => {
    const res = await apiClient.get<ApiResponse<LessonPlan[]>>(ENDPOINTS.TEACHER_LESSON_PLANS, {
      params: academicYear ? { academicYear } : {},
    });
    return res.data.data;
  },

  createLessonPlan: async (payload: CreateLessonPlanPayload): Promise<LessonPlan> => {
    const res = await apiClient.post<ApiResponse<LessonPlan>>(ENDPOINTS.TEACHER_LESSON_PLANS, payload);
    return res.data.data;
  },
};
