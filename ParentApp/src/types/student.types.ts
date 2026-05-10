export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  schoolId: number;
  currentClassId: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  photoUrl?: string;
  admissionNumber?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  totalFeesCollectedThisMonth: number;
  totalFeesPendingThisMonth: number;
  pendingFeeCount: number;
  booksIssued: number;
  upcomingEventsCount: number;
}
