import { apiClient } from './client';
import type { ApiResponse, RecordFeePaymentRequest } from '../types/api';
import type { Fee, FeePayment } from '../types';

export const feesApi = {
  getStudentFees: async (studentId: number): Promise<Fee[]> => {
    const res = await apiClient.get<ApiResponse<Fee[]>>(`/fees/student/${studentId}`);
    return res.data.data;
  },

  getStudentFeesByYear: async (studentId: number, year: string): Promise<Fee[]> => {
    const res = await apiClient.get<ApiResponse<Fee[]>>(
      `/fees/student/${studentId}/year/${year}`,
    );
    return res.data.data;
  },

  recordPayment: async (data: RecordFeePaymentRequest): Promise<FeePayment> => {
    const res = await apiClient.post<ApiResponse<FeePayment>>('/fees/payment', data);
    return res.data.data;
  },

  getPendingFees: async (): Promise<Fee[]> => {
    const res = await apiClient.get<ApiResponse<Fee[]>>('/fees/pending');
    return res.data.data;
  },

  getPaymentHistory: async (studentId: number): Promise<FeePayment[]> => {
    const res = await apiClient.get<ApiResponse<FeePayment[]>>(
      `/fees/history/student/${studentId}`,
    );
    return res.data.data;
  },
};
