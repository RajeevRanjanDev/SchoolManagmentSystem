// ─── Role Definitions ────────────────────────────────────────────────────────

export type RoleName =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'PARENT'
  | 'ACCOUNTANT'
  | 'LIBRARIAN'
  | 'TRANSPORT_MANAGER';

// ─── Core User ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profilePhotoUrl?: string;
  schoolId?: number;
  roles: RoleName[];
  active: boolean;
  createdAt: string;
}

export interface AuthUser extends User {
  schoolName?: string;
  schoolLogoUrl?: string;
}

// ─── School ──────────────────────────────────────────────────────────────────

export interface School {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  currentAcademicYear?: string;
  active: boolean;
}

// ─── Student ─────────────────────────────────────────────────────────────────

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profilePhotoUrl?: string;
  parentId?: number;
  parentName?: string;
  schoolId: number;
  currentClass?: string;
  currentSection?: string;
  active: boolean;
  createdAt: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  sectionId: number;
  attendanceDate: string;
  status: AttendanceStatus;
}

// ─── Homework ─────────────────────────────────────────────────────────────────

export interface Homework {
  id: number;
  sectionId: number;
  sectionName?: string;
  subject: string;
  title: string;
  description?: string;
  assignedDate: string;
  dueDate: string;
  attachmentUrl?: string;
  teacherId: number;
  teacherName?: string;
  createdAt: string;
}

// ─── Fee ─────────────────────────────────────────────────────────────────────

export type FeeStatus = 'PENDING' | 'PARTIAL_PAID' | 'PAID' | 'DEFAULT';
export type PaymentMethod = 'CASH' | 'ONLINE' | 'UPI' | 'CHEQUE' | 'NEFT';

export interface Fee {
  id: number;
  studentId: number;
  studentName?: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  academicYear: string;
  paidAmount?: number;
  pendingAmount?: number;
}

export interface FeePayment {
  id: number;
  feeId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentDate: string;
  recordedBy?: string;
}

// ─── Library ──────────────────────────────────────────────────────────────────

export type BookStatus = 'AVAILABLE' | 'ISSUED' | 'LOST';

export interface LibraryBook {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
}

export interface BookIssue {
  id: number;
  bookId: number;
  bookTitle: string;
  studentId: number;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  returned: boolean;
}

// ─── Transport ────────────────────────────────────────────────────────────────

export interface TransportRoute {
  id: number;
  routeName: string;
  startPoint: string;
  endPoint: string;
  stopPoints?: string[];
  vehicleId?: number;
}

export interface TransportVehicle {
  id: number;
  vehicleNumber: string;
  vehicleName: string;
  driverName?: string;
  driverPhone?: string;
  capacity?: number;
  routeId?: number;
  routeName?: string;
  gpsDeviceId?: string;
}

export interface BusLocation {
  vehicleId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// ─── Exam & Result ────────────────────────────────────────────────────────────

export interface Exam {
  id: number;
  sectionId: number;
  sectionName?: string;
  examName: string;
  subject: string;
  examDate: string;
  totalMarks: number;
  academicYear: string;
}

export interface ExamResult {
  id: number;
  examId: number;
  examName?: string;
  studentId: number;
  studentName?: string;
  marksObtained: number;
  grade?: string;
  published: boolean;
}

// ─── Timetable ────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export interface TimetableEntry {
  id: number;
  sectionId: number;
  teacherId: number;
  teacherName?: string;
  subject: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  academicYear: string;
}

// ─── Circular ─────────────────────────────────────────────────────────────────

export interface Circular {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdBy?: string;
  createdAt: string;
}

// ─── Event ────────────────────────────────────────────────────────────────────

export interface SchoolEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  venue?: string;
  published: boolean;
  photos?: EventPhoto[];
  createdAt: string;
}

export interface EventPhoto {
  id: number;
  eventId: number;
  photoUrl: string;
  caption?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'CIRCULAR'
  | 'ATTENDANCE'
  | 'FEE'
  | 'RESULT'
  | 'HOMEWORK'
  | 'EVENT'
  | 'GENERAL';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  referenceId?: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  attendancePercentageToday?: number;
  feeCollectedThisMonth?: number;
  pendingFeeCount?: number;
  pendingFeeAmount?: number;
  activeVehicles?: number;
  homeworkAssignedThisWeek?: number;
  upcomingEvents?: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Section / Class ──────────────────────────────────────────────────────────

export interface SchoolClass {
  id: number;
  className: string;
  schoolId: number;
}

export interface Section {
  id: number;
  sectionName: string;
  classId: number;
  className?: string;
  schoolId: number;
}
