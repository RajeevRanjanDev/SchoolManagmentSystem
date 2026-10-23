import Config from 'react-native-config';

export const API_BASE_URL = Config.API_BASE_URL ?? 'http://10.0.2.2:8080';
export const WS_URL = Config.WS_URL ?? 'http://10.0.2.2:8080';

export const API_PREFIX = '/api/v1';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',

  // Students (generic — admin use)
  STUDENTS: '/students',
  STUDENT_BY_ID: (id: number) => `/students/${id}`,

  // ── Parent Dashboard (child-scoped) ────────────────────────────────────────
  // Returns only children linked to the logged-in parent
  MY_CHILDREN: '/parent/children',

  // Child attendance — month = "2025-06"
  CHILD_ATTENDANCE: (studentId: number, month: string) =>
    `/parent/children/${studentId}/attendance?month=${month}`,

  // Child homework list with submission status
  CHILD_HOMEWORK: (studentId: number, academicYear: string) =>
    `/parent/children/${studentId}/homework?academicYear=${academicYear}`,

  // Submit homework
  CHILD_HOMEWORK_SUBMIT: (studentId: number, homeworkId: number) =>
    `/parent/children/${studentId}/homework/${homeworkId}/submit`,

  // Published exam results
  CHILD_RESULTS: (studentId: number) => `/parent/children/${studentId}/results`,

  // Fee records for the year
  CHILD_FEES: (studentId: number, academicYear: string) =>
    `/parent/children/${studentId}/fees?academicYear=${academicYear}`,

  // Class announcements / updates for one child
  CHILD_ANNOUNCEMENTS: (studentId: number) =>
    `/parent/children/${studentId}/announcements`,

  // Classwork for one child
  CHILD_CLASSWORK: (studentId: number) =>
    `/parent/children/${studentId}/classwork`,

  // Subject teachers for one child
  CHILD_TEACHERS: (studentId: number) =>
    `/parent/children/${studentId}/teachers`,
  // ── End Parent Dashboard ───────────────────────────────────────────────────

  // Logged-in user profile + school branding (name, logo, city)
  ME_PROFILE: '/me/profile',

  // ── Student portal (self-scoped — resolves the logged-in student) ───────────
  STUDENT_ME: '/student/me',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_FEES: '/student/fees',
  STUDENT_SELF_ATTENDANCE: '/student/attendance',
  STUDENT_ASSIGNMENTS: '/student/assignments',
  STUDENT_RESULTS: '/student/results',
  STUDENT_CIRCULARS: '/student/circulars',
  STUDENT_CHANGE_PASSWORD: '/student/change-password',

  // ── Teacher ────────────────────────────────────────────────────────────────
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_ASSIGNMENTS: '/teacher/my-assignments',
  TEACHER_CLASS_SECTIONS: '/teacher/my-class-sections',
  SECTION_STUDENTS: (sectionId: number) => `/admin/sections/${sectionId}/students`,
  TEACHER_ATTENDANCE: '/teacher/attendance',
  TEACHER_MARKS: '/teacher/marks',
  TEACHER_ANNOUNCEMENTS: '/teacher/announcements',
  TEACHER_HOMEWORK: '/teacher/homework',
  TEACHER_CLASSWORK: '/teacher/classwork',
  TEACHER_STUDENT_CARD: (studentId: number) => `/teacher/students/${studentId}`,
  TEACHER_LESSON_PLANS: '/teacher/lesson-plans',
  TIMETABLE_TEACHER: (teacherId: number) => `/timetable/teacher/${teacherId}`,
  HOMEWORK_SUBMISSIONS: (homeworkId: number) => `/homework/${homeworkId}/submissions`,
  HOMEWORK_REVIEW: (submissionId: number) => `/homework/submissions/${submissionId}/review`,
  EXAMS: '/exams',
  EXAM_BY_ID: (examId: number) => `/exams/${examId}`,
  EXAMS_BY_SECTION: (sectionId: number) => `/exams/section/${sectionId}`,
  EXAM_RESULTS: (examId: number) => `/exams/${examId}/results`,
  EXAM_PUBLISH_ALL: (examId: number) => `/exams/${examId}/results/publish-all`,

  // Attendance (section-level — not used in Parent App directly)
  STUDENT_ATTENDANCE: (studentId: number) => `/attendance/student/${studentId}`,
  ATTENDANCE_PERCENTAGE: (studentId: number) => `/attendance/student/${studentId}/percentage`,

  // Homework
  HOMEWORK: '/homework',
  HOMEWORK_BY_SECTION: (sectionId: number) => `/homework/section/${sectionId}`,

  // Timetable
  TIMETABLE: (sectionId: number) => `/timetable/section/${sectionId}`,

  // Circulars
  CIRCULARS: '/circulars',
  CIRCULAR_BY_ID: (id: number) => `/circulars/${id}`,

  // Events
  EVENTS: '/events',
  EVENT_BY_ID: (id: number) => `/events/${id}`,

  // Exams / Results
  RESULTS: (studentId: number) => `/exams/results/student/${studentId}`,

  // Fees
  FEES_BY_STUDENT: (studentId: number) => `/fees/student/${studentId}`,
  FEES_BY_YEAR: (studentId: number, year: string) => `/fees/student/${studentId}/year/${year}`,

  // Bus
  BUS_LOCATION: (vehicleId: number) => `/bus/live-location/${vehicleId}`,

  // Library
  LIBRARY_BOOKS: (studentId: number) => `/library/student/${studentId}/issued`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MARK_READ: (id: number) => `/notifications/${id}/read`,

  // Attachments (upload PDF/images for notices/circulars)
  ATTACHMENTS: '/attachments',

  // Circulars & Events (write)
  CIRCULARS_CREATE: '/circulars',
  EVENTS_CREATE: '/events',

  // Profile / User
  USER_BY_ID: (userId: number) => `/users/${userId}`,

  // Dashboard
  DASHBOARD: '/dashboard',

  // ── Admin (SCHOOL_ADMIN console) ────────────────────────────────────────────
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_CLASS_SECTIONS: (classId: number) => `/admin/classes/${classId}/sections`,
  ADMIN_SECTIONS: '/admin/sections',
  ADMIN_SUBJECTS: '/admin/subjects',
  ADMIN_FEE_TEMPLATES: '/admin/fee-templates',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_TEACHER_BY_ID: (id: number) => `/admin/teachers/${id}`,
  ADMIN_TEACHER_RESET_PWD: (id: number) => `/admin/teachers/${id}/reset-password`,
  ADMIN_TEACHER_STATUS: (id: number) => `/admin/teachers/${id}/status`,
  ADMISSION_STUDENTS: '/admission/students',
  ADMISSION_STUDENT_BY_ID: (id: number) => `/admission/students/${id}`,
  ADMISSION_RESET_PWD: (id: number) => `/admission/students/${id}/reset-password`,
  ADMISSION_ACTION: (id: number, action: string) => `/admission/students/${id}/${action}`,
  ADMISSION_ROLL: (id: number) => `/admission/students/${id}/roll-number`,
  // Teacher assignments
  ADMIN_TEACHER_ASSIGNMENTS: (teacherId: number) => `/admin/teachers/${teacherId}/assignments`,
  ADMIN_ASSIGNMENT: (assignmentId: number) => `/admin/assignments/${assignmentId}`,
  ADMIN_ASSIGNMENT_CLASS_TEACHER: (assignmentId: number) => `/admin/assignments/${assignmentId}/class-teacher`,
  // Fee template actions
  ADMIN_FEE_TEMPLATE_BY_ID: (id: number) => `/admin/fee-templates/${id}`,
  ADMIN_FEE_TEMPLATE_STATUS: (id: number) => `/admin/fee-templates/${id}/status`,
  ADMIN_FEE_TEMPLATE_APPLY: (id: number) => `/admin/fee-templates/${id}/apply`,
  // Library (admin/librarian)
  LIBRARY_CATALOG: '/library/books',
  LIBRARY_ISSUE: '/library/issue',
  LIBRARY_RETURN: (issueId: number) => `/library/return/${issueId}`,
  LIBRARY_STUDENT_ISSUED: (studentId: number) => `/library/student/${studentId}/issued`,
  // Attendance (admin view)
  ATTENDANCE_SECTION: (sectionId: number) => `/attendance/section/${sectionId}`,
  ADMIN_FEES: '/fees',
  ADMIN_FEES_SUMMARY: '/fees/summary',
  ADMIN_FEES_PENDING: '/fees/pending',
  ADMIN_FEES_PAYMENT: '/fees/payment',
  NOTIFICATIONS_BROADCAST: '/notifications/broadcast',
  NOTIFICATIONS_SENT: '/notifications/sent',

  // ── Finance (ACCOUNTANT) — reconciliation ───────────────────────────────────
  FINANCE_RECON: '/admin/finance/reconciliation',
  FINANCE_PAYMENTS: '/admin/finance/payments',
  FINANCE_RUNS: '/admin/finance/reconciliation/runs',
  FINANCE_EXCEPTIONS: '/admin/finance/reconciliation/exceptions',
  FINANCE_EXCEPTION_RESOLVE: (id: number) => `/admin/finance/reconciliation/exceptions/${id}/resolve`,
  FINANCE_PAYMENT_REFUND: (id: number) => `/admin/finance/payments/${id}/refunds`,
  FINANCE_GATEWAY_ACCOUNTS: '/admin/finance/gateway-accounts',

  // ── Transport (TRANSPORT_MANAGER) ───────────────────────────────────────────
  TRANSPORT_STUDENTS: '/transport/students',
  TRANSPORT_STUDENT_ASSIGN: (profileId: number) => `/transport/students/${profileId}/assign`,
  TRANSPORT_ROUTES: '/transport/routes',
  TRANSPORT_ROUTE_BY_ID: (id: number) => `/transport/routes/${id}`,
} as const;

// WebSocket topics
export const WS_TOPICS = {
  BUS_LOCATION: (vehicleId: number) => `/topic/bus/${vehicleId}`,
};
