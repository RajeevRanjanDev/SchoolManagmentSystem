export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  sectionId: number;
  attendanceDate: string;   // ISO date string YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}
