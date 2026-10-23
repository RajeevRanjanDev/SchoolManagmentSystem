import { apiClient } from './client';
import type { PageResponse } from '@/types/common.types';

const unwrap = (r: any) => r.data?.data ?? r.data;
const BASE = '/api/v1/admin/finance';

export interface ReconSummary {
  capturedTotal: number;
  allocatedTotal: number;
  expectedSettlement: number;
  unmatchedPayments: number;
  settlementExceptions: number;
  openExceptions: number;
}

export interface FinancePayment {
  id: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  method?: string;
  amount?: number;
  capturedAmount?: number;
  amountRefunded?: number;
  status: string;
  gatewayStatus?: string;
  allocated: boolean;
  receiptNumber?: string;
  capturedAt?: string;
  createdAt?: string;
}

export interface ReconException {
  id: number;
  exceptionType: string;
  referenceType?: string;
  referenceId?: number;
  description?: string;
  status: string;
  resolutionNote?: string;
  createdAt?: string;
}

export interface GatewayAccount {
  id: number;
  mode: string;
  keyId: string;
  hasSecret: boolean;
  hasWebhookSecret: boolean;
  active: boolean;
}

export const financeApi = {
  summary: (): Promise<ReconSummary> => apiClient.get(`${BASE}/reconciliation`).then(unwrap),

  payments: (page = 0, size = 20): Promise<PageResponse<FinancePayment>> =>
    apiClient.get(`${BASE}/payments`, { params: { page, size } }).then(unwrap),

  runReconciliation: (from?: string, to?: string) =>
    apiClient.post(`${BASE}/reconciliation/runs`, null, { params: { from, to } }).then(unwrap),

  runs: () => apiClient.get(`${BASE}/reconciliation/runs`).then(unwrap),

  exceptions: (status?: string): Promise<ReconException[]> =>
    apiClient.get(`${BASE}/reconciliation/exceptions`, { params: { status } }).then(unwrap),

  resolveException: (id: number, data: { status: string; note?: string }) =>
    apiClient.post(`${BASE}/reconciliation/exceptions/${id}/resolve`, data).then(unwrap),

  refund: (id: number, data: { amount?: number; reason?: string }) =>
    apiClient.post(`${BASE}/payments/${id}/refunds`, data).then(unwrap),

  importSettlements: (from: string, to: string) =>
    apiClient.post(`${BASE}/settlements/import`, null, { params: { from, to } }).then((r: any) => r.data),

  importBank: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post(`${BASE}/bank-statement/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r: any) => r.data);
  },

  gatewayAccounts: (): Promise<GatewayAccount[]> => apiClient.get(`${BASE}/gateway-accounts`).then(unwrap),

  saveGatewayAccount: (data: { mode: string; keyId: string; keySecret?: string; webhookSecret?: string; active?: boolean }) =>
    apiClient.post(`${BASE}/gateway-accounts`, data).then(unwrap),
};
