import { apiClient } from './client';
import { PAGE_SIZE } from '../constants';
import type { ApiResponse, CreateUserRequest } from '../types/api';
import type { User, Page } from '../types';

export const usersApi = {
  getAll: async (page = 0, size = PAGE_SIZE): Promise<Page<User>> => {
    const res = await apiClient.get<ApiResponse<Page<User>>>('/users', {
      params: { page, size },
    });
    return res.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },
};
