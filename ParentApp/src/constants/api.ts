import Config from 'react-native-config';

export const API_BASE_URL = Config.API_BASE_URL ?? 'http://10.0.2.2:8080';
export const WS_URL = Config.WS_URL ?? 'http://10.0.2.2:8080';

export const API_PREFIX = '/api/v1';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Students
  STUDENTS: '/students',
  STUDENT_BY_ID: (id: number) => `/students/${id}`,

  // Attendance
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

  // Profile / User
  USER_BY_ID: (userId: number) => `/users/${userId}`,

  // Dashboard
  DASHBOARD: '/dashboard',
} as const;

// WebSocket topics
export const WS_TOPICS = {
  BUS_LOCATION: (vehicleId: number) => `/topic/bus/${vehicleId}`,
};
