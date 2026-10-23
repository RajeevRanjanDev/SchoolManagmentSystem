import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;
const BASE = '/api/v1/admission/students';

export const admissionApi = {
  // CRUD
  register:  (data: any) => apiClient.post(BASE, data).then(unwrap),
  list:      (params?: { status?: string; statusGroup?: string; search?: string; classId?: number; sectionId?: number; page?: number; size?: number }) =>
               apiClient.get(BASE, { params: { size: 20, ...params } }).then(unwrap),
  getById:   (id: number) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  resetPassword: (id: number): Promise<string> =>
    apiClient.post(`${BASE}/${id}/reset-password`).then((r: any) => r.data?.message ?? 'Temporary password emailed'),
  update:    (id: number, data: any) => apiClient.put(`${BASE}/${id}`, data).then(unwrap),
  delete:    (id: number) => apiClient.delete(`${BASE}/${id}`),

  // Lifecycle
  admit:     (id: number, data: any) => apiClient.post(`${BASE}/${id}/admit`, data).then(unwrap),
  enroll:    (id: number, data: any) => apiClient.post(`${BASE}/${id}/enroll`, data).then(unwrap),
  promote:   (id: number, data: any) => apiClient.post(`${BASE}/${id}/promote`, data).then(unwrap),
  transfer:  (id: number, data: any) => apiClient.post(`${BASE}/${id}/transfer`, data).then(unwrap),
  dropout:   (id: number, remarks?: string) =>
               apiClient.post(`${BASE}/${id}/dropout`, null, { params: { remarks } }).then(unwrap),
  passout:   (id: number, remarks?: string) =>
               apiClient.post(`${BASE}/${id}/passout`, null, { params: { remarks } }).then(unwrap),
  alumni:    (id: number, remarks?: string) =>
               apiClient.post(`${BASE}/${id}/alumni`, null, { params: { remarks } }).then(unwrap),

  // Guardian & transport updates
  updateGuardians: (id: number, data: any[]) =>
    apiClient.put(`${BASE}/${id}/guardians`, data).then(unwrap),
  updateTransport: (id: number, data: any) =>
    apiClient.put(`${BASE}/${id}/transport`, data).then(unwrap),
  updateMedical: (id: number, data: any) =>
    apiClient.put(`${BASE}/${id}/medical`, data).then(unwrap),
  updateContact: (id: number, data: { mobile: string; email: string }) =>
    apiClient.put(`${BASE}/${id}/contact`, data).then(unwrap),

  // Assign or change a student's class/section (dedicated endpoint — not a lifecycle promotion)
  assignClassSection: (id: number, data: any) =>
    apiClient.post(`${BASE}/${id}/assign-class`, data).then(unwrap),

  // ── Enrollment operations ──────────────────────────────────────────
  assignRollNumber: (id: number, rollNumber: string) =>
    apiClient.patch(`${BASE}/${id}/roll-number`, null, { params: { rollNumber } }).then(unwrap),
  moveToSection: (id: number, sectionId: number) =>
    apiClient.post(`${BASE}/${id}/move-section`, null, { params: { sectionId } }).then(unwrap),
  deactivate: (id: number, remarks?: string) =>
    apiClient.post(`${BASE}/${id}/deactivate`, null, { params: { remarks } }).then(unwrap),
  promoteClass: (params: { fromClassId: number; toClassId: number; fromAcademicYear: string; toAcademicYear: string }) =>
    apiClient.post(`${BASE}/promote-class`, null, { params }).then((r: any) => r.data),

  // History
  getHistory: (id: number) => apiClient.get(`${BASE}/${id}/history`).then(unwrap),

  // Documents
  uploadDocument: (id: number, documentType: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', documentType);
    return apiClient.post(`${BASE}/${id}/documents`, fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
  verifyDocument: (studentId: number, documentId: number, data: { status: string; rejectionReason?: string }) =>
    apiClient.patch(`${BASE}/${studentId}/documents/${documentId}/verify`, data).then(unwrap),
};

// Transport routes list — endpoint may not exist yet; fail soft so the wizard still loads.
export const transportRoutesApi = {
  list: () => apiClient.get('/api/v1/transport/routes').then(unwrap).catch(() => []),
};

// Campuses list
export const campusesApi = {
  list: () => apiClient.get('/api/v1/campuses').then(unwrap),
};
