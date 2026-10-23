import { apiClient } from './client';
import type { DashboardStats } from '@/types/academic.types';

export const dashboardApi = {
  // The backend returns an ApiResponse-wrapped DashboardResponse whose field
  // names differ from the UI's keys — unwrap and map to DashboardStats.
  getStats: (): Promise<DashboardStats> =>
    apiClient.get('/api/v1/dashboard').then((r) => {
      const d = (r.data?.data ?? r.data ?? {}) as any;
      return {
        totalStudents: d.totalStudents ?? 0,
        totalTeachers: d.totalTeachers ?? 0,
        presentToday: d.todayPresentCount ?? 0,
        pendingFees: Number(d.totalFeesPendingThisMonth ?? 0),
        upcomingExams: d.upcomingEventsCount ?? 0,
        totalBooks: d.booksIssued ?? 0,
      } as DashboardStats;
    }),
};
