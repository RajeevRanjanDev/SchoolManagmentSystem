import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface DailyWork {
  id: number;
  sectionId: number;
  sectionName: string;
  className?: string;
  workDate: string;
  type: 'HOMEWORK' | 'CLASSWORK';
  description: string;
  createdByName?: string;
  updatedAt?: string;
}

export const dailyWorkApi = {
  getBySectionAndDate: (sectionId: number, date: string): Promise<DailyWork[]> =>
    apiClient.get(`/api/v1/daily-work/section/${sectionId}`, { params: { date } }).then(unwrap),

  upsert: (data: { sectionId: number; workDate: string; type: 'HOMEWORK' | 'CLASSWORK'; description: string }) =>
    apiClient.post('/api/v1/daily-work', data).then(unwrap),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/daily-work/${id}`),
};
