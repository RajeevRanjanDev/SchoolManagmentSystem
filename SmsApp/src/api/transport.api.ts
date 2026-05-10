import { apiClient } from './client';
import type { ApiResponse, UpdateBusLocationRequest } from '../types/api';
import type { TransportVehicle, TransportRoute, BusLocation } from '../types';

export const transportApi = {
  updateBusLocation: async (data: UpdateBusLocationRequest): Promise<void> => {
    await apiClient.post('/bus/location', data);
  },

  getLiveLocation: async (vehicleId: number): Promise<BusLocation> => {
    const res = await apiClient.get<ApiResponse<BusLocation>>(
      `/bus/live-location/${vehicleId}`,
    );
    return res.data.data;
  },

  // These would be additional endpoints if server exposes them
  getVehicles: async (): Promise<TransportVehicle[]> => {
    const res = await apiClient.get<ApiResponse<TransportVehicle[]>>('/bus/vehicles');
    return res.data.data;
  },

  getRoutes: async (): Promise<TransportRoute[]> => {
    const res = await apiClient.get<ApiResponse<TransportRoute[]>>('/bus/routes');
    return res.data.data;
  },
};
