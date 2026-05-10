import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, BusLocation } from '@app-types/index';

export const busService = {
  getBusLocation: async (vehicleId: number): Promise<BusLocation> => {
    const res = await apiClient.get<ApiResponse<BusLocation>>(
      ENDPOINTS.BUS_LOCATION(vehicleId),
    );
    return res.data.data;
  },
};
