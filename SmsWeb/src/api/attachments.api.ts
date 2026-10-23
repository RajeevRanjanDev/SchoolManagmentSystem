import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface UploadedAttachment {
  id: number;
  url: string;          // e.g. /api/v1/attachments/12
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
}

export const attachmentsApi = {
  /** Upload a PDF/image; returns its download URL + metadata. */
  upload: (file: File): Promise<UploadedAttachment> => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient
      .post('/api/v1/attachments', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },

  /**
   * Download (or open) an attachment by its URL. The endpoint is auth-protected,
   * so we fetch it as a blob through the authenticated axios client rather than
   * linking directly, then open it in a new tab.
   */
  open: async (url: string, fileName?: string) => {
    const res = await apiClient.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data as Blob);
    const win = window.open(blobUrl, '_blank');
    // Fallback to a download if the browser blocks the popup.
    if (!win) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'attachment';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  },
};
