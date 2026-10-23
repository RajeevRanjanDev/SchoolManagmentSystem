import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import {
  ApiResponse,
  Student,
  DashboardStats,
} from '@app-types/index';

// ── Response shapes from the new parent dashboard endpoints ──────────────────

export interface ChildSummary {
  studentId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  admissionNumber?: string;
  profilePictureUrl?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  relationshipType: string;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  academicYear?: string;
  rollNumber?: string;
}

export interface MonthlyAttendance {
  studentId: number;
  month: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  attendancePercentage: number;
  records: AttendanceDayRecord[];
}

export interface AttendanceDayRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
  remarks?: string;
}

export interface HomeworkWithSubmission {
  id: number;
  title: string;
  description?: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  attachmentUrl?: string;
  submissionStatus?: string;
  submissionUrl?: string;
  grade?: string;
  teacherRemarks?: string;
}

export interface ChildResult {
  id: number;
  examName: string;
  subject: string;
  examDate?: string;
  totalMarks?: number;
  marksObtained: number;
  grade?: string;
  remarks?: string;
  isPublished: boolean;
}

export interface ChildFee {
  id: number;
  feeCategory: string;
  academicYear: string;
  feePeriod?: string;
  amount: number;
  discount?: number;
  fine?: number;
  netAmount?: number;
  paidAmount?: number;
  balance?: number;
  dueDate?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  remarks?: string;
}

/** A class announcement / update shown to a child (shape is backend-driven; kept loose). */
export interface ChildAnnouncement {
  id: number;
  title: string;
  content?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  // the backend may name the timestamp differently across versions — read defensively
  date?: string;
  createdAt?: string;
  publishedAt?: string;
}

export interface ChildClasswork {
  id: number;
  title: string;
  subject?: string;
  description?: string;
  teacherName?: string;
  date?: string;
  workDate?: string;
  createdAt?: string;
}

export interface ChildTeacher {
  teacherId?: number;
  teacherName?: string;
  subjectName?: string;
  subject?: string;
  className?: string;
  sectionName?: string;
  isClassTeacher?: boolean;
  email?: string;
  mobile?: string;
}

/** Logged-in user profile + school branding (fields vary; read defensively). */
export interface ParentProfile {
  fullName?: string;
  email?: string;
  role?: string;
  schoolName?: string;
  schoolCity?: string;
  schoolLogoUrl?: string;
  [key: string]: unknown;
}

export interface SubmitHomeworkPayload {
  submissionUrl?: string;
  textResponse?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const studentService = {
  /**
   * Returns children linked to the authenticated parent.
   * Previously called /students (wrong). Now calls /parent/children.
   * @param academicYear  e.g. "2025-26" — optional filter for enrollment
   */
  getMyChildren: async (academicYear?: string): Promise<ChildSummary[]> => {
    const params = academicYear ? { academicYear } : {};
    const res = await apiClient.get<ApiResponse<ChildSummary[]>>(
      ENDPOINTS.MY_CHILDREN,
      { params },
    );
    return res.data.data;
  },

  /** @deprecated Use getMyChildren instead */
  getMyStudents: async (): Promise<ChildSummary[]> => {
    return studentService.getMyChildren();
  },

  // ── Student detail (admin-compatible) ──────────────────────────────────────

  getStudentById: async (id: number): Promise<Student> => {
    const res = await apiClient.get<ApiResponse<Student>>(
      ENDPOINTS.STUDENT_BY_ID(id),
    );
    return res.data.data;
  },

  // ── Child-scoped data fetchers ─────────────────────────────────────────────

  /**
   * Monthly attendance for one child.
   * @param month  "yyyy-MM" format, e.g. "2025-06"
   */
  getChildAttendance: async (
    studentId: number,
    month: string,
  ): Promise<MonthlyAttendance> => {
    const res = await apiClient.get<ApiResponse<MonthlyAttendance>>(
      `/parent/children/${studentId}/attendance`,
      { params: { month } },
    );
    return res.data.data;
  },

  /**
   * Homework list for one child for an academic year, with submission status.
   */
  getChildHomework: async (
    studentId: number,
    academicYear: string,
  ): Promise<HomeworkWithSubmission[]> => {
    const res = await apiClient.get<ApiResponse<HomeworkWithSubmission[]>>(
      `/parent/children/${studentId}/homework`,
      { params: { academicYear } },
    );
    return res.data.data;
  },

  /**
   * Submit homework on behalf of a child.
   */
  submitHomework: async (
    studentId: number,
    homeworkId: number,
    payload: SubmitHomeworkPayload,
  ): Promise<HomeworkWithSubmission> => {
    const res = await apiClient.post<ApiResponse<HomeworkWithSubmission>>(
      ENDPOINTS.CHILD_HOMEWORK_SUBMIT(studentId, homeworkId),
      payload,
    );
    return res.data.data;
  },

  /**
   * Published exam results for one child.
   */
  getChildResults: async (studentId: number): Promise<ChildResult[]> => {
    const res = await apiClient.get<ApiResponse<ChildResult[]>>(
      ENDPOINTS.CHILD_RESULTS(studentId),
    );
    return res.data.data;
  },

  /**
   * Fee records for one child for the given academic year.
   */
  getChildFees: async (
    studentId: number,
    academicYear: string,
  ): Promise<ChildFee[]> => {
    const res = await apiClient.get<ApiResponse<ChildFee[]>>(
      `/parent/children/${studentId}/fees`,
      { params: { academicYear } },
    );
    return res.data.data;
  },

  /**
   * Class announcements / updates for one child.
   */
  getChildAnnouncements: async (
    studentId: number,
  ): Promise<ChildAnnouncement[]> => {
    const res = await apiClient.get<ApiResponse<ChildAnnouncement[]>>(
      ENDPOINTS.CHILD_ANNOUNCEMENTS(studentId),
    );
    return res.data.data;
  },

  /** Classwork for one child. */
  getChildClasswork: async (
    studentId: number,
    academicYear: string,
  ): Promise<ChildClasswork[]> => {
    const res = await apiClient.get<ApiResponse<ChildClasswork[]>>(
      `/parent/children/${studentId}/classwork`,
      { params: { academicYear } },
    );
    return res.data.data;
  },

  /** Subject teachers for one child. */
  getChildTeachers: async (
    studentId: number,
    academicYear: string,
  ): Promise<ChildTeacher[]> => {
    const res = await apiClient.get<ApiResponse<ChildTeacher[]>>(
      ENDPOINTS.CHILD_TEACHERS(studentId),
      { params: { academicYear } },
    );
    return res.data.data;
  },

  // ── Logged-in parent profile + school branding ──────────────────────────────

  getMyProfile: async (): Promise<ParentProfile> => {
    const res = await apiClient.get<ApiResponse<ParentProfile>>(
      ENDPOINTS.ME_PROFILE,
    );
    return res.data.data;
  },

  // ── Dashboard stats (admin endpoint — kept for compatibility) ───────────────

  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>(
      ENDPOINTS.DASHBOARD,
    );
    return res.data.data;
  },
};
