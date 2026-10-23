import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface StudentMe {
  studentId: number;
  admissionNumber: string;
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
  studentName: string;
  schoolName?: string;
  className?: string;
  sectionName?: string;
  attendanceRate: number;
  outstandingFee: number;
  todayAssignments: number;
  todayUpdates: number;
}

export interface StudentNotice {
  id: number;
  category: string;
  title: string;
  body?: string;
  source: string;
  read: boolean;
  date?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface StudentAssignment {
  id: number;
  type: 'HOMEWORK' | 'CLASSWORK';
  subject?: string;
  title?: string;
  description?: string;
  date?: string;
  dueDate?: string;
}

export interface StudentAttendance {
  percentage: number;
  present: number;
  absent: number;
  late: number;
  total: number;
  months: { label: string; present: number; absent: number; total: number }[];
  recent: { date: string; status: string; remarks?: string }[];
}

export interface StudentResult {
  id: number;
  examName: string;
  subject?: string;
  examDate?: string;
  totalMarks?: number;
  marksObtained?: number;
  grade?: string;
  published: boolean;
}

export const studentPortalApi = {
  me: (): Promise<StudentMe> => apiClient.get('/api/v1/student/me').then(unwrap),
  dashboard: (): Promise<StudentDashboard> => apiClient.get('/api/v1/student/dashboard').then(unwrap),
  fees: (): Promise<any[]> => apiClient.get('/api/v1/student/fees').then(unwrap),
  attendance: (): Promise<StudentAttendance> => apiClient.get('/api/v1/student/attendance').then(unwrap),
  assignments: (): Promise<StudentAssignment[]> => apiClient.get('/api/v1/student/assignments').then(unwrap),
  circulars: (): Promise<StudentNotice[]> => apiClient.get('/api/v1/student/circulars').then(unwrap),
  results: (): Promise<StudentResult[]> => apiClient.get('/api/v1/student/results').then(unwrap),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/api/v1/student/change-password', data).then((r: any) => r.data?.message ?? 'Password changed'),
};
