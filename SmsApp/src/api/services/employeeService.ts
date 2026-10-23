import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse } from '@app-types/index';

const data = <T>(res: { data: ApiResponse<T> }): T => res.data.data;

// ── Finance (reconciliation) ─────────────────────────────────────────────────

export interface ReconSummary {
  capturedTotal: number;
  allocatedTotal: number;
  expectedSettlement: number;
  unmatchedPayments: number;
  settlementExceptions: number;
  openExceptions: number;
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

export interface FinancePayment {
  id: number;
  razorpayPaymentId?: string;
  method?: string;
  amount?: number;
  capturedAmount?: number;
  amountRefunded?: number;
  status: string;
  allocated?: boolean;
  receiptNumber?: string;
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

export const financeService = {
  summary: async (): Promise<ReconSummary> => data(await apiClient.get<ApiResponse<ReconSummary>>(ENDPOINTS.FINANCE_RECON)),
  runReconciliation: async (from?: string, to?: string): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.FINANCE_RUNS, null, { params: { from, to } })),
  exceptions: async (status?: string): Promise<ReconException[]> =>
    data(await apiClient.get<ApiResponse<ReconException[]>>(ENDPOINTS.FINANCE_EXCEPTIONS, { params: { status } })),
  resolveException: async (id: number, payload: { status: string; note?: string }): Promise<ReconException> =>
    data(await apiClient.post<ApiResponse<ReconException>>(ENDPOINTS.FINANCE_EXCEPTION_RESOLVE(id), payload)),

  payments: async (page = 0, size = 20): Promise<{ content: FinancePayment[] }> =>
    data(await apiClient.get<ApiResponse<{ content: FinancePayment[] }>>(ENDPOINTS.FINANCE_PAYMENTS, { params: { page, size } })),
  refund: async (id: number, payload: { amount?: number; reason?: string }): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.FINANCE_PAYMENT_REFUND(id), payload)),
  gatewayAccounts: async (): Promise<GatewayAccount[]> => data(await apiClient.get<ApiResponse<GatewayAccount[]>>(ENDPOINTS.FINANCE_GATEWAY_ACCOUNTS)),
  saveGatewayAccount: async (payload: { mode: string; keyId: string; keySecret?: string; webhookSecret?: string; active?: boolean }): Promise<any> =>
    data(await apiClient.post<ApiResponse<any>>(ENDPOINTS.FINANCE_GATEWAY_ACCOUNTS, payload)),
};

// ── Transport ────────────────────────────────────────────────────────────────

export interface TransportStudent {
  profileId: number;
  fullName: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
  transportRequired: boolean;
  routeId?: number;
  routeName?: string;
  stopName?: string;
  pickupPoint?: string;
  transportType?: string;
}

export interface RouteStop {
  id?: number;
  stopName: string;
  pickupTime?: string;
  seqOrder?: number;
}

export interface TransportRoute {
  id: number;
  routeName: string;
  routeNumber: string;
  startPoint?: string;
  endPoint?: string;
  monthlyFee?: number;
  active: boolean;
  inchargeName?: string;
  stops: RouteStop[];
}

export interface AssignTransportPayload {
  transportRequired: boolean;
  routeId?: number | null;
  routeName?: string;
  stopName?: string;
  transportType?: string;
}

export interface CreateRoutePayload {
  routeName: string;
  routeNumber: string;
  startPoint?: string;
  endPoint?: string;
  monthlyFee?: number;
  stops: { stopName: string; pickupTime?: string }[];
}

export const transportMgrService = {
  listStudents: async (params?: { classId?: number; sectionId?: number; routeId?: number; search?: string }): Promise<TransportStudent[]> =>
    data(await apiClient.get<ApiResponse<TransportStudent[]>>(ENDPOINTS.TRANSPORT_STUDENTS, { params })),
  assignStudent: async (profileId: number, payload: AssignTransportPayload): Promise<any> =>
    data(await apiClient.put<ApiResponse<any>>(ENDPOINTS.TRANSPORT_STUDENT_ASSIGN(profileId), payload)),
  listRoutes: async (): Promise<TransportRoute[]> => data(await apiClient.get<ApiResponse<TransportRoute[]>>(ENDPOINTS.TRANSPORT_ROUTES)),
  createRoute: async (payload: CreateRoutePayload): Promise<TransportRoute> =>
    data(await apiClient.post<ApiResponse<TransportRoute>>(ENDPOINTS.TRANSPORT_ROUTES, payload)),
  deleteRoute: async (id: number): Promise<void> => { await apiClient.delete(ENDPOINTS.TRANSPORT_ROUTE_BY_ID(id)); },
};
