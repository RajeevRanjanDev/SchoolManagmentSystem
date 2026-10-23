import { apiClient } from './client';
import type { PageResponse } from '@/types/common.types';

const unwrap = (r: any) => r.data?.data ?? r.data;
const BASE = '/api/v1/super';

export interface Tenant {
  id: number;
  name: string;
  legalName?: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  status: string;                 // TRIAL | ACTIVE | SUSPENDED | TERMINATED
  subscriptionPlan?: string;
  subscriptionPlanCode?: string;
  subscriptionExpiry?: string;
  currentAcademicYear?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
  studentCount?: number;
  teacherCount?: number;
  parentCount?: number;
  maxStudents?: number;
  maxTeachers?: number;
  maxParents?: number;
  studentUsagePct?: number;
  teacherUsagePct?: number;
  parentUsagePct?: number;
  overLimitAlert?: boolean;
  subscriptionExpiringSoon?: boolean;
  subscriptionExpired?: boolean;
  usageAlert?: boolean;
  daysToExpiry?: number;
  alertReasons?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legal & configuration (Phase 2)
  registrationNumber?: string;
  registrationDate?: string;
  schoolType?: string;
  pan?: string;                   // masked
  gstin?: string;
  gstinVerified?: boolean;
  affiliationBoard?: string;
  affiliationNumber?: string;
  recognitionDetails?: string;
  affiliationValidFrom?: string;
  affiliationValidTo?: string;
  operationalAddress?: string;
  operationalCity?: string;
  operationalState?: string;
  operationalPincode?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  signatureUrl?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptPrefix?: string;
  senderDisplayName?: string;
  notificationEmail?: string;
  notificationPhone?: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  entityType?: string;
  description?: string;
  performedBy?: string;
  createdAt?: string;
}

export interface SchoolAdmin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  active: boolean;
  status: string;
  createdAt?: string;
}

export interface Invoice {
  id: number;
  schoolId: number;
  invoiceNumber: string;
  planCode?: string;
  planName?: string;
  billingPeriod?: string;
  amount: number;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  status: string;
  notes?: string;
}

export interface PlanPayload {
  id?: number;
  planCode: string;
  planName: string;
  description?: string;
  maxStudents?: number;
  maxTeachers?: number;
  maxParents?: number;
  maxStorageGb?: number;
  features?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  trialDays?: number;
  status?: string;
}

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  terminatedTenants: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalUsers: number;
  monthlyRecurringRevenue: number;
  newTenantsThisMonth: number;
  newStudentsThisMonth: number;
  alertSchools: number;
}

export interface Plan {
  id: number;
  planCode: string;
  planName: string;
  description?: string;
  maxStudents: number;
  maxTeachers: number;
  maxParents: number;
  maxStorageGb: number;
  features?: string;
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;
  status: string;
}

export interface CreateTenantPayload {
  name: string;
  legalName?: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  planCode?: string;
  status?: string;
  currentAcademicYear?: string;
  // Optional first admin
  adminFirstName?: string;
  adminLastName?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminMobile?: string;
}

export const superAdminApi = {
  stats: (): Promise<PlatformStats> => apiClient.get(`${BASE}/stats`).then(unwrap),

  listPlans: (): Promise<Plan[]> => apiClient.get(`${BASE}/plans`).then(unwrap),

  listSchools: (params?: { status?: string; search?: string; page?: number; size?: number }): Promise<PageResponse<Tenant>> =>
    apiClient.get(`${BASE}/schools`, { params: { size: 20, ...params } }).then(unwrap),

  alertSchools: (): Promise<Tenant[]> => apiClient.get(`${BASE}/schools/alerts`).then(unwrap),

  getSchool: (id: number): Promise<Tenant> => apiClient.get(`${BASE}/schools/${id}`).then(unwrap),

  createSchool: (data: CreateTenantPayload): Promise<Tenant> =>
    apiClient.post(`${BASE}/schools`, data).then(unwrap),

  updateSchool: (id: number, data: CreateTenantPayload): Promise<Tenant> =>
    apiClient.put(`${BASE}/schools/${id}`, data).then(unwrap),

  updateStatus: (id: number, status: string, reason?: string): Promise<Tenant> =>
    apiClient.patch(`${BASE}/schools/${id}/status`, { status, reason }).then(unwrap),

  assignSubscription: (id: number, planCode: string, expiryDate?: string): Promise<Tenant> =>
    apiClient.post(`${BASE}/schools/${id}/subscription`, { planCode, expiryDate }).then(unwrap),

  createAdmin: (id: number, data: { firstName: string; lastName: string; email: string; password?: string; mobile?: string }) =>
    apiClient.post(`${BASE}/schools/${id}/admin`, data).then((r: any) => r.data?.message ?? 'Admin created'),

  // ── Phase 2: config / history / export ──────────────────────────────
  updateConfig: (id: number, data: Record<string, any>): Promise<Tenant> =>
    apiClient.put(`${BASE}/schools/${id}/config`, data).then(unwrap),

  getHistory: (id: number): Promise<AuditEntry[]> =>
    apiClient.get(`${BASE}/schools/${id}/history`).then(unwrap),

  exportSchool: async (id: number, name: string) => {
    const res = await apiClient.get(`${BASE}/schools/${id}/export`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name || 'school'}-export.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  },

  // ── Phase 3: admin accounts ─────────────────────────────────────────
  listAdmins: (id: number): Promise<SchoolAdmin[]> =>
    apiClient.get(`${BASE}/schools/${id}/admins`).then(unwrap),

  resetAdminPassword: (id: number, userId: number): Promise<string> =>
    apiClient.post(`${BASE}/schools/${id}/admins/${userId}/reset-password`).then((r: any) => r.data?.message ?? 'Password reset'),

  setAdminStatus: (id: number, userId: number, active: boolean): Promise<SchoolAdmin> =>
    apiClient.patch(`${BASE}/schools/${id}/admins/${userId}/status`, null, { params: { active } }).then(unwrap),

  // ── Phase 4: billing / plans ────────────────────────────────────────
  renewSubscription: (id: number, months: number): Promise<Tenant> =>
    apiClient.post(`${BASE}/schools/${id}/subscription/renew`, null, { params: { months } }).then(unwrap),

  listInvoices: (id: number): Promise<Invoice[]> =>
    apiClient.get(`${BASE}/schools/${id}/invoices`).then(unwrap),

  createInvoice: (id: number, data: { planCode?: string; billingPeriod?: string; amount: number; issueDate?: string; dueDate?: string; notes?: string }): Promise<Invoice> =>
    apiClient.post(`${BASE}/schools/${id}/invoices`, data).then(unwrap),

  markInvoicePaid: (id: number, invoiceId: number): Promise<Invoice> =>
    apiClient.patch(`${BASE}/schools/${id}/invoices/${invoiceId}/paid`).then(unwrap),

  listAllPlans: (): Promise<Plan[]> => apiClient.get(`${BASE}/all-plans`).then(unwrap),

  upsertPlan: (data: PlanPayload): Promise<Plan> =>
    apiClient.post(`${BASE}/plans`, data).then(unwrap),
};
