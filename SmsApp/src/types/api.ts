// Standard API wrapper returned by Spring Boot backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  schoolId?: number;
  email: string;
  fullName: string;
  roles: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ─── Student ─────────────────────────────────────────────────────────────────

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  parentId?: number;
  classId?: number;
  sectionId?: number;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  roles: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface MarkAttendanceRequest {
  sectionId: number;
  attendanceDate: string; // YYYY-MM-DD
  studentAttendanceMap: Record<number, 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE'>;
}

// ─── Fee ─────────────────────────────────────────────────────────────────────

export interface RecordFeePaymentRequest {
  feeId: number;
  amountPaid: number;
  paymentMethod: 'CASH' | 'ONLINE' | 'UPI' | 'CHEQUE' | 'NEFT';
  transactionId?: string;
}

// ─── Homework ─────────────────────────────────────────────────────────────────

export interface CreateHomeworkRequest {
  sectionId: number;
  subject: string;
  title: string;
  description?: string;
  assignedDate: string;
  dueDate: string;
  attachmentUrl?: string;
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface AddBookRequest {
  title: string;
  author?: string;
  isbn?: string;
  copies?: number;
}

export interface IssueBookRequest {
  bookId: number;
  studentId: number;
  dueDate: string;
}

// ─── Bus ─────────────────────────────────────────────────────────────────────

export interface UpdateBusLocationRequest {
  vehicleId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// ─── Exam ─────────────────────────────────────────────────────────────────────

export interface ScheduleExamRequest {
  sectionId: number;
  examName: string;
  subject: string;
  examDate: string;
  totalMarks: number;
  academicYear: string;
}

export interface UploadResultRequest {
  examId: number;
  studentId: number;
  marksObtained: number;
  grade?: string;
}

// ─── Timetable ────────────────────────────────────────────────────────────────

export interface CreateTimetableRequest {
  sectionId: number;
  teacherId: number;
  subject: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  academicYear: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface RegisterDeviceRequest {
  fcmToken: string;
  deviceType: 'ANDROID' | 'IOS';
  deviceName: string;
}

// ─── Circular ─────────────────────────────────────────────────────────────────

export interface CreateCircularRequest {
  title: string;
  content: string;
  publish?: boolean;
}

// ─── Event ────────────────────────────────────────────────────────────────────

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventDate: string;
  venue?: string;
  publish?: boolean;
}

export interface AddEventPhotoRequest {
  photoUrl: string;
  caption?: string;
}

// ─── School ──────────────────────────────────────────────────────────────────

export interface CreateSchoolRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  currentAcademicYear?: string;
}
