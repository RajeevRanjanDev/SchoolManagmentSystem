import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, FeeRecord, FeePaymentRequest } from '@app-types/index';

export const feeService = {
  getStudentFees: async (studentId: number): Promise<FeeRecord[]> => {
    const res = await apiClient.get<ApiResponse<FeeRecord[]>>(
      ENDPOINTS.FEES_BY_STUDENT(studentId),
    );
    return res.data.data;
  },

  getFeesByYear: async (
    studentId: number,
    year: string,
  ): Promise<FeeRecord[]> => {
    const res = await apiClient.get<ApiResponse<FeeRecord[]>>(
      ENDPOINTS.FEES_BY_YEAR(studentId, year),
    );
    return res.data.data;
  },

  recordPayment: async (data: FeePaymentRequest): Promise<FeeRecord> => {
    const res = await apiClient.post<ApiResponse<FeeRecord>>(
      '/fees/payment',
      data,
    );
    return res.data.data;
  },
};
