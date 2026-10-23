import type { Gender } from './common.types';

// ── Legacy Student (used by fees, attendance modules) ────────────────────────
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'EXPELLED';

export interface Student {
  id: number;
  schoolId: number;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  profilePictureUrl?: string;
  admissionDate: string;
  mobile?: string;
  email?: string;
  status: StudentStatus;
  isActive: boolean;
  transportRouteId?: number;
  currentSection?: { id: number; name: string; className: string };
  createdAt: string;
}

// ── New Admission Module types ────────────────────────────────────────────────
export type StudentLifecycleStatus =
  | 'LEAD' | 'INQUIRY' | 'APPLICANT' | 'ADMISSION_REVIEW'
  | 'ADMITTED' | 'ENROLLED' | 'PROMOTED' | 'TRANSFERRED'
  | 'DROPPED' | 'PASSED_OUT' | 'ALUMNI';

export interface GuardianSummary {
  id: number;
  relation: string;
  fullName: string;
  mobile?: string;
  email?: string;
  occupation?: string;
  primary: boolean;
}

export interface AcademicSummary {
  institutionType: string;
  academicSession?: string;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  rollNumber?: string;
  program?: string;
  course?: string;
  department?: string;
  branch?: string;
  semester?: number;
  yearOfStudy?: number;
  batchName?: string;
  batchStartDate?: string;
  batchEndDate?: string;
}

export interface DocumentSummary {
  id: number;
  documentType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  fileUrl?: string;
  mandatory: boolean;
  verifiedAt?: string;
}

export interface StudentHistoryEntry {
  id: number;
  fromStatus?: string;
  toStatus: string;
  action: string;
  remarks?: string;
  changedBy?: string;
  effectiveDate?: string;
  createdAt?: string;
}

export interface StudentProfile {
  id: number;
  studentCode: string;
  admissionNumber: string;
  enrollmentNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  dateOfBirth?: string;
  bloodGroup?: string;
  category?: string;
  nationality?: string;
  mobile?: string;
  email?: string;
  profilePhotoUrl?: string;
  lifecycleStatus: StudentLifecycleStatus;
  admissionDate?: string;
  admissionType?: string;
  campusId?: number;
  academic?: AcademicSummary;
  guardians: GuardianSummary[];
  documents: DocumentSummary[];
  pendingDocuments: number;
  verifiedDocuments: number;
  createdAt?: string;
}

// ── Request types ─────────────────────────────────────────────────────────────
export interface GuardianRequest {
  relation: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  occupation?: string;
  annualIncome?: number;
  qualification?: string;
  aadhaarNumber?: string;
  primary: boolean;
}

export interface TransportRequest {
  transportRequired: boolean;
  routeId?: number;
  routeName?: string;
  stopName?: string;
  pickupPoint?: string;
  transportType?: string;
}

export interface ClassSectionAssignRequest {
  targetClassId: number;
  targetSectionId?: number;
  targetAcademicSession?: string;
  remarks?: string;
  effectiveDate?: string;
}

export interface HostelRequest {
  hostelRequired: boolean;
  hostelName?: string;
  roomNumber?: string;
  hostelType?: string;
}

// ── Legacy aliases (used by students.api.ts and StudentsPage) ─────────────────
export type CreateStudentRequest = Partial<Student> & {
  firstName: string;
  lastName: string;
  admissionNumber: string;
  gender: Gender;
};
export type UpdateStudentRequest = Partial<CreateStudentRequest>;
