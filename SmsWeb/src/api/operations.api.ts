import { apiClient } from './client';
import type { PageResponse } from '@/types/common.types';

const unwrap = (r: any) => r.data?.data ?? r.data;
const BASE = '/api/v1/super/operations';

export interface OpsSummary {
  systemErrors: number;
  affectedSchools: number;
  failedPayments: number;
  criticalIncidents: number;
  openIncidents: number;
}

export interface ErrorLog {
  id: number;
  schoolId?: number;
  schoolName?: string;
  service: string;
  severity: string;
  errorCode?: string;
  message?: string;
  requestId?: string;
  traceId?: string;
  userId?: number;
  httpMethod?: string;
  httpPath?: string;
  httpStatus?: number;
  referenceType?: string;
  referenceId?: number;
  environment?: string;
  occurrenceCount: number;
  status: string;
  ownerUserId?: number;
  resolutionNote?: string;
  createdAt?: string;
  lastSeenAt?: string;
  resolvedAt?: string;
  stackTrace?: string;
}

export const operationsApi = {
  summary: (hours = 24): Promise<OpsSummary> =>
    apiClient.get(`${BASE}/summary`, { params: { hours } }).then(unwrap),

  errors: (params: { schoolId?: number; service?: string; severity?: string; status?: string; hours?: number; page?: number; size?: number }): Promise<PageResponse<ErrorLog>> =>
    apiClient.get(`${BASE}/errors`, { params }).then(unwrap),

  detail: (id: number): Promise<ErrorLog> => apiClient.get(`${BASE}/errors/${id}`).then(unwrap),

  resolve: (id: number, data: { status: string; note?: string }) =>
    apiClient.post(`${BASE}/errors/${id}/resolve`, data).then(unwrap),

  services: (): Promise<string[]> => apiClient.get(`${BASE}/services`).then(unwrap),
};
