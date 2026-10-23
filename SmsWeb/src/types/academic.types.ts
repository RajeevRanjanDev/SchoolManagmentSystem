export interface SchoolClass {
  id: number;
  name: string;
  numericName?: number;
  academicYear: string;
  schoolId: number;
}

export interface Section {
  id: number;
  name: string;
  schoolClassId: number;
  schoolClassName: string;
  classTeacherId?: number;
  classTeacherName?: string;
  maxCapacity: number;
  schoolId: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  schoolId: number;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  sectionId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface MarkAttendanceRequest {
  sectionId: number;
  attendanceDate: string;
  records: { studentId: number; status: AttendanceStatus; remarks?: string }[];
}

export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';
export type PaymentMethod = 'CASH' | 'ONLINE' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CARD';

export interface Fee {
  id: number;
  studentId: number;
  studentName: string;
  feeCategory: string;
  academicYear: string;
  feePeriod: string;
  amount: number;
  discount: number;
  fine: number;
  dueDate: string;
  status: FeeStatus;
  remarks?: string;
}

export interface FeePayment {
  id: number;
  feeId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  receiptNumber: string;
  collectedByName: string;
}

export interface Homework {
  id: number;
  sectionId: number;
  sectionName: string;
  teacherId: number;
  teacherName: string;
  subject: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  attachmentUrl?: string;
}

export interface Exam {
  id: number;
  sectionId: number;
  sectionName: string;
  examName: string;
  subject: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  academicYear: string;
}

export interface ExamResult {
  id: number;
  examId: number;
  examName: string;
  studentId: number;
  studentName: string;
  marksObtained: number;
  grade: string;
  remarks?: string;
  isPublished: boolean;
}

export interface TimetableEntry {
  id: number;
  sectionId: number;
  teacherId: number;
  teacherName: string;
  subject: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  academicYear: string;
}

export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  category?: string;
  totalCopies: number;
  availableCopies: number;
  status: 'AVAILABLE' | 'ISSUED' | 'ARCHIVED';
  shelfLocation?: string;
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
  fineAmount: number;
}

export interface Circular {
  id: number;
  title: string;
  content: string;
  publishedDate: string;
  attachmentUrl?: string;
  isPublished: boolean;
  publishedByName: string;
}

export interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  isPublished: boolean;
  photos?: EventPhoto[];
}

export interface EventPhoto {
  id: number;
  photoUrl: string;
  caption?: string;
  uploadedByName: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: 'ATTENDANCE' | 'FEE' | 'HOMEWORK' | 'EXAM' | 'CIRCULAR' | 'EVENT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface Teacher {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  qualification?: string;
  specialization?: string;
  joiningDate: string;
  experienceYears?: number;
  photoUrl?: string;
  mobile?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  isClassTeacher: boolean;
}

export interface TransportVehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: 'BUS' | 'MINI_BUS' | 'VAN';
  capacity: number;
  driverName: string;
  driverPhone: string;
  conductorName?: string;
  conductorPhone?: string;
  routeId?: number;
  routeName?: string;
  isActive: boolean;
}

export interface BusLocation {
  vehicleId: number;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  recordedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  presentToday: number;
  pendingFees: number;
  upcomingExams: number;
  totalBooks: number;
}
