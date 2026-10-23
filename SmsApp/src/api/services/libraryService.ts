import apiClient from '../client';
import { ENDPOINTS } from '@constants/api';
import { ApiResponse, LibraryBook } from '@app-types/index';

export const libraryService = {
  getIssuedBooks: async (studentId: number): Promise<LibraryBook[]> => {
    const res = await apiClient.get<ApiResponse<LibraryBook[]>>(
      ENDPOINTS.LIBRARY_BOOKS(studentId),
    );
    return res.data.data;
  },
};
