export type FeeStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'WAIVED';

export interface FeeRecord {
  id: number;
  studentId: number;
  studentName: string;
  feeCategory: string;
  academicYear: string;
  feePeriod: string;
  amount: number;
  discount: number;
  fine: number;
  netAmount: number;
  dueDate: string;
  status: FeeStatus;
  remarks?: string;
  paidDate?: string;
  receiptNumber?: string;
}

export interface FeePaymentRequest {
  feeIds: number[];
  paymentMethod: 'CASH' | 'ONLINE' | 'UPI' | 'CARD' | 'CHEQUE';
  transactionId?: string;
  remarks?: string;
}
