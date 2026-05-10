import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2 to reach host machine localhost
// For iOS simulator, localhost works directly
// For physical device, use your machine's IP address
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:8080/api/v1`;
export const WS_BASE_URL = `ws://${DEV_HOST}:8080/ws`;

// JWT storage keys in SecureStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sms_access_token',
  REFRESH_TOKEN: 'sms_refresh_token',
  USER_DATA: 'sms_user_data',
} as const;

// React Query cache keys
export const QUERY_KEYS = {
  DASHBOARD: ['dashboard'],
  STUDENTS: ['students'],
  STUDENT: (id: number) => ['student', id],
  USERS: ['users'],
  TEACHERS: ['teachers'],
  PARENTS: ['parents'],
  ATTENDANCE: (sectionId: number, date: string) => ['attendance', sectionId, date],
  STUDENT_ATTENDANCE: (studentId: number) => ['student-attendance', studentId],
  HOMEWORK: (sectionId: number) => ['homework', sectionId],
  FEES_PENDING: ['fees-pending'],
  STUDENT_FEES: (studentId: number) => ['fees', studentId],
  LIBRARY_BOOKS: ['library-books'],
  ISSUED_BOOKS: (studentId: number) => ['issued-books', studentId],
  BUS_LOCATION: (vehicleId: number) => ['bus-location', vehicleId],
  VEHICLES: ['vehicles'],
  ROUTES: ['routes'],
  EXAMS: (sectionId: number) => ['exams', sectionId],
  EXAM_RESULTS: (studentId: number) => ['exam-results', studentId],
  TIMETABLE_SECTION: (sectionId: number) => ['timetable-section', sectionId],
  TIMETABLE_TEACHER: (teacherId: number) => ['timetable-teacher', teacherId],
  CIRCULARS: ['circulars'],
  EVENTS: ['events'],
  EVENT_PHOTOS: (eventId: number) => ['event-photos', eventId],
  NOTIFICATIONS: ['notifications'],
  NOTIFICATION_COUNT: ['notification-unread-count'],
} as const;

// Pagination defaults
export const PAGE_SIZE = 20;

// Academic year helper — returns current year like "2024-25"
export const CURRENT_ACADEMIC_YEAR = (() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`;
})();

// Days of week in order
export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};

// Attendance status colors
export const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: '#4CAF50',
  ABSENT: '#F44336',
  HALF_DAY: '#FF9800',
  LEAVE: '#9E9E9E',
};

// Fee status colors
export const FEE_STATUS_COLORS: Record<string, string> = {
  PAID: '#4CAF50',
  PARTIAL_PAID: '#FF9800',
  PENDING: '#F44336',
  DEFAULT: '#9C27B0',
};
