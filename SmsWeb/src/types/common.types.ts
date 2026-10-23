export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

export type RoleName =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'PARENT'
  | 'ACCOUNTANT'
  | 'LIBRARIAN'
  | 'TRANSPORT_MANAGER'
  | 'SUPPORT_STAFF'
  | 'ADMISSION_OFFICER'
  | 'PRINCIPAL'
  | 'DEAN'
  | 'STUDENT';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
