import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse } from '@app-types/index';

export interface Attachment {
  id: number;
  url: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

export const attachmentService = {
  /** Upload a picked file (PDF / image, ≤10MB) and return its stored URL + name. */
  upload: async (file: PickedFile): Promise<Attachment> => {
    const fd = new FormData();
    // React Native FormData file shape.
    fd.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
    const res = await apiClient.post<ApiResponse<Attachment>>(ENDPOINTS.ATTACHMENTS, fd, {
      // Do NOT hard-code Content-Type. Strip the client's JSON default so React
      // Native sets `multipart/form-data; boundary=…` itself — without the boundary
      // the server can't parse the parts.
      transformRequest: (data, headers) => {
        if (headers) {
          delete (headers as any)['Content-Type'];
          delete (headers as any)['content-type'];
          if (typeof (headers as any).delete === 'function') {
            (headers as any).delete('Content-Type');
          }
        }
        return data;
      },
    });
    return res.data.data;
  },
};
