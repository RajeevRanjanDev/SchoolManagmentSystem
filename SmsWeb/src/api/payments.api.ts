import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface CreateOrderResponse {
  paymentAttemptId: number;
  razorpayOrderId: string;
  amount: number;          // paise
  amountRupees: number;
  currency: string;
  razorpayKeyId: string;
  schoolName: string;
  studentName?: string;
  prefillEmail?: string;
  prefillContact?: string;
}

export interface StudentPaymentView {
  id: number;
  razorpayPaymentId?: string;
  method?: string;
  capturedAmount?: number;
  amount?: number;
  status: string;
  allocated: boolean;
  receiptNumber?: string;
  capturedAt?: string;
  createdAt?: string;
}

export const studentPaymentsApi = {
  createOrder: (feeIds: number[]): Promise<CreateOrderResponse> =>
    apiClient.post('/api/v1/student/payments/orders', { feeIds }).then(unwrap),

  verify: (data: { paymentAttemptId: number; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    apiClient.post('/api/v1/student/payments/verify', data).then(unwrap),

  history: (): Promise<StudentPaymentView[]> =>
    apiClient.get('/api/v1/student/payments/history').then(unwrap),
};

/** Lazily inject the Razorpay Checkout script; resolves true once available. */
let rzpLoading: Promise<boolean> | null = null;
export function loadRazorpay(): Promise<boolean> {
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (rzpLoading) return rzpLoading;
  rzpLoading = new Promise<boolean>((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => { rzpLoading = null; resolve(false); };
    document.body.appendChild(s);
  });
  return rzpLoading;
}
