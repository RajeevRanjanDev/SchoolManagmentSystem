import { apiClient } from './client';
import type { BusLocation } from '@/types/academic.types';

const unwrap = (r: any) => r.data?.data ?? r.data;

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
  inchargeTeacherId?: number;
  inchargeName?: string;
  stops: RouteStop[];
}

export interface TransportRoutePayload {
  routeName: string;
  routeNumber: string;
  startPoint?: string;
  endPoint?: string;
  monthlyFee?: number;
  inchargeTeacherId?: number | null;
  stops: { stopName: string; pickupTime?: string }[];
}

export interface TransportStudent {
  profileId: number;
  fullName: string;
  admissionNumber?: string;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  transportRequired: boolean;
  routeId?: number;
  routeName?: string;
  stopName?: string;
  pickupPoint?: string;
  transportType?: string;
}

export const transportStudentsApi = {
  list: (params?: { classId?: number; sectionId?: number; routeId?: number; search?: string }): Promise<TransportStudent[]> =>
    apiClient.get('/api/v1/transport/students', { params }).then(unwrap),

  assign: (profileId: number, data: { transportRequired: boolean; routeId?: number | null; routeName?: string; stopName?: string; transportType?: string }) =>
    apiClient.put(`/api/v1/transport/students/${profileId}/assign`, data).then(unwrap),
};

export const routesApi = {
  list: (): Promise<TransportRoute[]> =>
    apiClient.get('/api/v1/transport/routes').then(unwrap),

  create: (data: TransportRoutePayload): Promise<TransportRoute> =>
    apiClient.post('/api/v1/transport/routes', data).then(unwrap),

  update: (id: number, data: TransportRoutePayload): Promise<TransportRoute> =>
    apiClient.put(`/api/v1/transport/routes/${id}`, data).then(unwrap),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/transport/routes/${id}`).then(unwrap),
};

export const transportApi = {
  updateLocation: (data: {
    vehicleId: number;
    latitude: number;
    longitude: number;
    speedKmh: number;
  }) => apiClient.post('/api/v1/bus/location', data).then((r) => r.data),

  getLiveLocation: (vehicleId: number) =>
    apiClient.get<BusLocation>(`/api/v1/bus/live-location/${vehicleId}`).then((r) => r.data),
};
