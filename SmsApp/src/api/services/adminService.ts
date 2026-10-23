import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, PageResponse } from '@app-types/index';

// ── Shapes (mirrored from SmsWeb admin api modules) ──────────────────────────

export interface AdminDashboard {
  totalStudents: number;
  totalTeachers: number;
  presentToday: number;
  pendingFees: number;
  upcomingExams: number;
  totalBooks: number;
}

export interface AdminStudent {
  id: number;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  status?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;
  mobile?: string;
  email?: string;
}

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  employeeCode?: string;
  role?: 'TEACHER' | 'ACCOUNTANT' | 'TRANSPORT_MANAGER' | 'SCHOOL_ADMIN' | 'SUPPORT_STAFF';
  mobile?: string;
  qualification?: string;
  specialization?: string;
  joiningDate: string;
  experienceYears?: number;
  status?: string;
}

export interface AdminTeacher {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  employeeCode?: string;
  loginId?: string;
  role?: string;
  qualification?: string;
  status?: string;
}

export interface SchoolClass {
  id: number;
  name: string;
  numericName?: number;
  academicYear?: string;
  status?: string;
  sectionCount?: number;
}

export interface Section {
  id: number;
  name: string;
  classId?: number;
  className?: string;
  maxCapacity?: number;
  classTeacherName?: string;
  status?: string;
}

export interface Subject {
  id: number;
  subjectName: string;
  subjectCode?: string;
  description?: string;
  status?: string;
}

export interface AdminFee {
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
}

export interface FeeSummary {
  totalBilled?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  totalStudents?: number;
  [k: string]: unknown;
}

export interface RecordPaymentRequest {
  feeId: number;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  remarks?: string;
}

export interface BroadcastRequest {
  title: string;
  body: string;
  type?: string;
  audience?: string;
  classId?: number;
  sectionId?: number;
  studentId?: number;
  feeType?: string;
  scheduledAt?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

const data = <T>(res: { data: ApiResponse<T> }): T => res.data.data;

// ── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  // Dashboard — backend field names differ; map to the UI keys (as SmsWeb does).
  getDashboard: async (): Promise<AdminDashboard> => {
    const res = await apiClient.get<ApiResponse<any>>(ENDPOINTS.DASHBOARD);
    const d = (res.data?.data ?? {}) as any;
    return {
      totalStudents: d.totalStudents ?? 0,
      totalTeachers: d.totalTeachers ?? 0,
      presentToday: d.todayPresentCount ?? 0,
      pendingFees: Number(d.totalFeesPendingThisMonth ?? 0),
      upcomingExams: d.upcomingEventsCount ?? 0,
      totalBooks: d.booksIssued ?? 0,
    };
  },

  // Students (admission)
  listStudents: async (params?: { search?: string; classId?: number; sectionId?: number; status?: string; page?: number; size?: number }): Promise<PageResponse<AdminStudent>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminStudent>>>(ENDPOINTS.ADMISSION_STUDENTS, {
      params: { size: 20, ...params },
    });
    return res.data.data;
  },
  getStudent: async (id: number): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(ENDPOINTS.ADMISSION_STUDENT_BY_ID(id));
    return res.data.data;
  },
  registerStudent: async (payload: any): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(ENDPOINTS.ADMISSION_STUDENTS, payload);
    return res.data.data;
  },
  resetStudentPassword: async (id: number): Promise<string> => {
    const res = await apiClient.post<ApiResponse<void>>(ENDPOINTS.ADMISSION_RESET_PWD(id));
    return res.data.message ?? 'Temporary password emailed';
  },

  // Student lifecycle. body actions (admit/enroll/promote/transfer) take LifecycleTransitionRequest;
  // param actions (dropout/passout/alumni/deactivate) take ?remarks=.
  lifecycleAction: async (id: number, action: 'admit' | 'enroll' | 'promote' | 'transfer', body: any): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.ADMISSION_ACTION(id, action), body)),
  lifecycleRemark: async (id: number, action: 'dropout' | 'passout' | 'alumni' | 'deactivate', remarks?: string): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.ADMISSION_ACTION(id, action), null, { params: { remarks } })),
  assignRoll: async (id: number, rollNumber: string): Promise<any> =>
    data(await apiClient.patch<ApiResponse<any>>(ENDPOINTS.ADMISSION_ROLL(id), null, { params: { rollNumber } })),

  // Teacher assignments
  teacherAssignments: async (teacherId: number, academicYear?: string): Promise<any[]> =>
    data(await apiClient.get<ApiResponse<any[]>>(ENDPOINTS.ADMIN_TEACHER_ASSIGNMENTS(teacherId), { params: { academicYear } })),
  assignTeacher: async (teacherId: number, payload: { classId: number; sectionId: number; subjectId: number; academicYear: string; isClassTeacher?: boolean }): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.ADMIN_TEACHER_ASSIGNMENTS(teacherId), payload)),
  removeAssignment: async (assignmentId: number): Promise<void> => { await apiClient.delete(ENDPOINTS.ADMIN_ASSIGNMENT(assignmentId)); },
  setClassTeacher: async (assignmentId: number, isClassTeacher: boolean): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ADMIN_ASSIGNMENT_CLASS_TEACHER(assignmentId), null, { params: { isClassTeacher } });
  },

  // Fee templates
  createFeeTemplate: async (payload: any): Promise<any> => data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.ADMIN_FEE_TEMPLATES, payload)),
  setFeeTemplateStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<any> =>
    data(await apiClient.patch<ApiResponse<any>>(ENDPOINTS.ADMIN_FEE_TEMPLATE_STATUS(id), null, { params: { status } })),
  deleteFeeTemplate: async (id: number): Promise<void> => { await apiClient.delete(ENDPOINTS.ADMIN_FEE_TEMPLATE_BY_ID(id)); },
  applyFeeTemplate: async (id: number, payload: { scope: 'CLASS' | 'SECTION' | 'STUDENT'; classId?: number; sectionId?: number; studentId?: number }): Promise<any> =>
    (await apiClient.post(ENDPOINTS.ADMIN_FEE_TEMPLATE_APPLY(id), payload)).data,

  // Library
  listBooks: async (page = 0, size = 50): Promise<PageResponse<any>> =>
    data(await apiClient.get<ApiResponse<PageResponse<any>>>(ENDPOINTS.LIBRARY_CATALOG, { params: { page, size } })),
  addBook: async (params: { title: string; author?: string; isbn?: string; copies?: number }): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.LIBRARY_CATALOG, null, { params })),
  issueBook: async (params: { bookId: number; studentId: number; dueDate: string }): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.LIBRARY_ISSUE, null, { params })),
  returnBook: async (issueId: number): Promise<any> => data(await apiClient.patch<ApiResponse<any>>(ENDPOINTS.LIBRARY_RETURN(issueId))),

  // Attendance (admin view)
  sectionAttendance: async (sectionId: number, date: string): Promise<any[]> =>
    data(await apiClient.get<ApiResponse<any[]>>(ENDPOINTS.ATTENDANCE_SECTION(sectionId), { params: { date } })),

  // Teachers
  listTeachers: async (): Promise<AdminTeacher[]> => data(await apiClient.get<ApiResponse<AdminTeacher[]>>(ENDPOINTS.ADMIN_TEACHERS)),
  createTeacher: async (payload: CreateTeacherRequest): Promise<AdminTeacher> =>
    data(await apiClient.post<ApiResponse<AdminTeacher>>(ENDPOINTS.ADMIN_TEACHERS, payload)),
  updateTeacherStatus: async (id: number, status: string): Promise<AdminTeacher> =>
    data(await apiClient.patch<ApiResponse<AdminTeacher>>(ENDPOINTS.ADMIN_TEACHER_STATUS(id), null, { params: { status } })),
  resetTeacherPassword: async (id: number): Promise<string> => {
    const res = await apiClient.post<ApiResponse<void>>(ENDPOINTS.ADMIN_TEACHER_RESET_PWD(id));
    return res.data.message ?? 'Temporary password emailed';
  },

  // Classes & sections
  listClasses: async (academicYear?: string): Promise<SchoolClass[]> =>
    data(await apiClient.get<ApiResponse<SchoolClass[]>>(ENDPOINTS.ADMIN_CLASSES, { params: academicYear ? { academicYear } : {} })),
  createClass: async (payload: { name: string; numericName?: number; academicYear: string }): Promise<SchoolClass> =>
    data(await apiClient.post<ApiResponse<SchoolClass>>(ENDPOINTS.ADMIN_CLASSES, payload)),
  listSections: async (classId: number): Promise<Section[]> =>
    data(await apiClient.get<ApiResponse<Section[]>>(ENDPOINTS.ADMIN_CLASS_SECTIONS(classId))),
  createSection: async (classId: number, payload: { name: string; maxCapacity?: number; classTeacherId?: number }): Promise<Section> =>
    data(await apiClient.post<ApiResponse<Section>>(ENDPOINTS.ADMIN_CLASS_SECTIONS(classId), payload)),

  // Fee templates (lookup for admission)
  listFeeTemplates: async (): Promise<Array<{ id: number; name: string; feeType?: string; amount?: number; academicYear?: string; status?: string }>> =>
    data(await apiClient.get<ApiResponse<any[]>>(ENDPOINTS.ADMIN_FEE_TEMPLATES)),

  // Subjects
  listSubjects: async (): Promise<Subject[]> => data(await apiClient.get<ApiResponse<Subject[]>>(ENDPOINTS.ADMIN_SUBJECTS)),
  createSubject: async (payload: { subjectName: string; subjectCode: string; description?: string }): Promise<Subject> =>
    data(await apiClient.post<ApiResponse<Subject>>(ENDPOINTS.ADMIN_SUBJECTS, payload)),

  // Fees
  listFees: async (status?: string, academicYear?: string): Promise<AdminFee[]> =>
    data(await apiClient.get<ApiResponse<AdminFee[]>>(ENDPOINTS.ADMIN_FEES, { params: { status, academicYear } })),
  feeSummary: async (academicYear?: string): Promise<FeeSummary> =>
    data(await apiClient.get<ApiResponse<FeeSummary>>(ENDPOINTS.ADMIN_FEES_SUMMARY, { params: { academicYear } })),
  pendingFees: async (): Promise<AdminFee[]> => data(await apiClient.get<ApiResponse<AdminFee[]>>(ENDPOINTS.ADMIN_FEES_PENDING)),
  recordPayment: async (payload: RecordPaymentRequest): Promise<AdminFee> =>
    data(await apiClient.post<ApiResponse<AdminFee>>(ENDPOINTS.ADMIN_FEES_PAYMENT, payload)),

  // Communication
  broadcast: async (payload: BroadcastRequest): Promise<void> => {
    await apiClient.post(ENDPOINTS.NOTIFICATIONS_BROADCAST, payload);
  },
  sentHistory: async (page = 0, size = 30): Promise<PageResponse<any>> =>
    data(await apiClient.get<ApiResponse<PageResponse<any>>>(ENDPOINTS.NOTIFICATIONS_SENT, { params: { page, size } })),
};
