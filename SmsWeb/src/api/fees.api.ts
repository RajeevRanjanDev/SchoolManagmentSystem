import { apiClient } from './client';

export interface CreateFeeRequest {
  studentId: number;
  feeCategory: string;
  academicYear: string;
  feePeriod: string;
  amount: number;
  discount?: number;
  fine?: number;
  dueDate: string;
  remarks?: string;
}

export interface RecordPaymentRequest {
  feeId: number;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  remarks?: string;
}

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface FeeTemplate {
  id: number;
  name: string;
  feeType: string;
  amount: number;
  frequency: string;
  dueDayOfMonth?: number;
  graceDays?: number;
  lateFeeEnabled: boolean;
  lateFeeAmount?: number;
  repeatedLateFeeAmount?: number;
  partialAllowed: boolean;
  minPartialPercent?: number;
  reminderDaysBefore?: number;
  reminderOnDueDate: boolean;
  reminderDaysAfter?: number;
  concessionType: string;
  concessionValue?: number;
  academicYear: string;
  status: string;
}

export type CreateFeeTemplateRequest = Omit<FeeTemplate, 'id'>;

export const feeTemplatesApi = {
  list: (): Promise<FeeTemplate[]> =>
    apiClient.get('/api/v1/admin/fee-templates').then(unwrap),
  create: (data: CreateFeeTemplateRequest) =>
    apiClient.post('/api/v1/admin/fee-templates', data).then(unwrap),
  update: (id: number, data: CreateFeeTemplateRequest) =>
    apiClient.put(`/api/v1/admin/fee-templates/${id}`, data).then(unwrap),
  setStatus: (id: number, status: 'ACTIVE' | 'INACTIVE') =>
    apiClient.patch(`/api/v1/admin/fee-templates/${id}/status`, null, { params: { status } }).then(unwrap),
  delete: (id: number) =>
    apiClient.delete(`/api/v1/admin/fee-templates/${id}`),
  assignToClass: (id: number, classId: number) =>
    apiClient.post(`/api/v1/admin/fee-templates/${id}/assign/class/${classId}`).then((r: any) => r.data),
  apply: (id: number, data: { scope: 'CLASS' | 'SECTION' | 'STUDENT'; classId?: number; sectionId?: number; studentId?: number }) =>
    apiClient.post(`/api/v1/admin/fee-templates/${id}/apply`, data).then((r: any) => r.data),
};

export const feesApi = {
  // admin
  create:      (data: CreateFeeRequest)            => apiClient.post('/api/v1/fees', data).then(unwrap),
  getAll:      (status?: string, academicYear?: string) =>
    apiClient.get('/api/v1/fees', { params: { status, academicYear } }).then(unwrap),
  getSummary:  (academicYear?: string)             =>
    apiClient.get('/api/v1/fees/summary', { params: { academicYear } }).then(unwrap),
  getPending:  ()                                  => apiClient.get('/api/v1/fees/pending').then(unwrap),
  recordPayment: (data: RecordPaymentRequest)      => apiClient.post('/api/v1/fees/payment', data).then(unwrap),

  // student / parent view
  getByStudent:        (studentId: number)                  => apiClient.get(`/api/v1/fees/student/${studentId}`).then(unwrap),
  getByStudentAndYear: (studentId: number, year: string)    => apiClient.get(`/api/v1/fees/student/${studentId}/year/${year}`).then(unwrap),
  getHistory:          (studentId: number)                  => apiClient.get(`/api/v1/fees/history/student/${studentId}`).then(unwrap),

  // reconciliation / ledger
  getStudentPayments:  (studentId: number)                  => apiClient.get(`/api/v1/fees/student/${studentId}/payments`).then(unwrap),
  getSectionSummary:   (sectionId: number, academicYear?: string) =>
    apiClient.get(`/api/v1/fees/section/${sectionId}/summary`, { params: { academicYear } }).then(unwrap),
  adjustFee:           (feeId: number, params: { discount?: number; waiveRemaining?: boolean; remarks: string }) =>
    apiClient.post(`/api/v1/fees/${feeId}/adjust`, null, { params }).then(unwrap),
};
