export * from './api.types';
export * from './auth.types';
export * from './student.types';
export * from './attendance.types';
export * from './fee.types';

// ── Homework ────────────────────────────────────────────────────
export interface Homework {
  id: number;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  assignedDate: string;
  teacherName: string;
  sectionId: number;
  attachmentUrl?: string;
  status?: 'PENDING' | 'SUBMITTED' | 'GRADED';
}

// ── Timetable ───────────────────────────────────────────────────
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface TimetablePeriod {
  id: number;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;   // HH:mm
  endTime: string;
  subject: string;
  teacherName: string;
  roomNumber?: string;
}

// ── Circular ────────────────────────────────────────────────────
export interface Circular {
  id: number;
  title: string;
  content: string;
  category: string;
  publishedDate: string;
  attachmentUrl?: string;
  isRead?: boolean;
}

// ── Event ───────────────────────────────────────────────────────
export interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  photoUrls: string[];
  category: string;
}

// ── Exam Result ─────────────────────────────────────────────────
export interface ExamResult {
  id: number;
  examName: string;
  examDate: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks?: string;
  percentage: number;
}

// ── Bus Tracking ────────────────────────────────────────────────
export interface BusLocation {
  vehicleId: number;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  recordedAt: string;
  driverName: string;
  driverPhone: string;
}

export interface BusRoute {
  id: number;
  routeName: string;
  vehicleId: number;
  stops: RouteStop[];
}

export interface RouteStop {
  id: number;
  stopName: string;
  latitude: number;
  longitude: number;
  estimatedArrivalTime: string;
  order: number;
}

// ── Library ─────────────────────────────────────────────────────
export interface LibraryBook {
  id: number;
  bookTitle: string;
  author: string;
  isbn: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  fineAmount?: number;
}

// ── Notification ────────────────────────────────────────────────
export interface AppNotification {
  id: number;
  title: string;
  body: string;
  type: 'HOMEWORK' | 'CIRCULAR' | 'FEE' | 'ATTENDANCE' | 'BUS' | 'EXAM' | 'GENERAL';
  isRead: boolean;
  createdAt: string;
  referenceId?: number;
}
