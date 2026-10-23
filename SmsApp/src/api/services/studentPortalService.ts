import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse } from '@app-types/index';

// ── Response shapes (match the backend student-portal DTOs) ──────────────────

export interface StudentMe {
  studentId: number;
  admissionNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  mobile?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;
  fatherName?: string;
  motherName?: string;
  schoolName?: string;
  transportRequired?: boolean;
  routeName?: string;
  stopName?: string;
  pickupPoint?: string;
  transportType?: string;
}

export interface StudentDashboard {
  studentName?: string;
  schoolName?: string;
  className?: string;
  sectionName?: string;
  attendanceRate: number;    // 0-100
  outstandingFee: number;
  todayAssignments: number;
  todayUpdates: number;
}

export interface StudentAttendanceMonth {
  label: string;
  present: number;
  absent: number;
  total: number;
}
export interface StudentAttendanceDay {
  date: string;
  status: string;
  remarks?: string;
}
export interface StudentAttendance {
  percentage: number;
  present: number;
  absent: number;
  late: number;
  total: number;
  months: StudentAttendanceMonth[];
  recent: StudentAttendanceDay[];
}

export interface StudentAssignment {
  id: number;
  type: 'HOMEWORK' | 'CLASSWORK';
  subject?: string;
  title: string;
  description?: string;
  date?: string;
  dueDate?: string;
}

export interface StudentResult {
  id: number;
  examName: string;
  subject?: string;
  examDate?: string;
  totalMarks?: number;
  marksObtained?: number;
  grade?: string;
  published?: boolean;
}

export interface StudentNotice {
  id: number;
  category?: string;
  title: string;
  body?: string;
  source?: string;
  read?: boolean;
  date?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface StudentFee {
  id: number;
  studentId?: number;
  studentName?: string;
  feeCategory?: string;
  academicYear?: string;
  feePeriod?: string;
  amount: number;
  discount?: number;
  fine?: number;
  netAmount?: number;
  paidAmount?: number;
  balance?: number;
  dueDate?: string;
  status: string;
  remarks?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const studentPortalService = {
  getMe: async (): Promise<StudentMe> => {
    const res = await apiClient.get<ApiResponse<StudentMe>>(ENDPOINTS.STUDENT_ME);
    return res.data.data;
  },

  getDashboard: async (): Promise<StudentDashboard> => {
    const res = await apiClient.get<ApiResponse<StudentDashboard>>(ENDPOINTS.STUDENT_DASHBOARD);
    return res.data.data;
  },

  getFees: async (): Promise<StudentFee[]> => {
    const res = await apiClient.get<ApiResponse<StudentFee[]>>(ENDPOINTS.STUDENT_FEES);
    return res.data.data;
  },

  getAttendance: async (): Promise<StudentAttendance> => {
    const res = await apiClient.get<ApiResponse<StudentAttendance>>(ENDPOINTS.STUDENT_SELF_ATTENDANCE);
    return res.data.data;
  },

  getAssignments: async (): Promise<StudentAssignment[]> => {
    const res = await apiClient.get<ApiResponse<StudentAssignment[]>>(ENDPOINTS.STUDENT_ASSIGNMENTS);
    return res.data.data;
  },

  getResults: async (): Promise<StudentResult[]> => {
    const res = await apiClient.get<ApiResponse<StudentResult[]>>(ENDPOINTS.STUDENT_RESULTS);
    return res.data.data;
  },

  getCirculars: async (): Promise<StudentNotice[]> => {
    const res = await apiClient.get<ApiResponse<StudentNotice[]>>(ENDPOINTS.STUDENT_CIRCULARS);
    return res.data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.post(ENDPOINTS.STUDENT_CHANGE_PASSWORD, payload);
  },
};
