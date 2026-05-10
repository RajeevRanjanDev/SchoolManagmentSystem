import { apiClient } from './client';
import { PAGE_SIZE } from '../constants';
import type { ApiResponse, AddBookRequest, IssueBookRequest } from '../types/api';
import type { LibraryBook, BookIssue, Page } from '../types';

export const libraryApi = {
  getBooks: async (page = 0, size = PAGE_SIZE): Promise<Page<LibraryBook>> => {
    const res = await apiClient.get<ApiResponse<Page<LibraryBook>>>('/library/books', {
      params: { page, size },
    });
    return res.data.data;
  },

  addBook: async (data: AddBookRequest): Promise<LibraryBook> => {
    const res = await apiClient.post<ApiResponse<LibraryBook>>('/library/books', null, {
      params: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        copies: data.copies ?? 1,
      },
    });
    return res.data.data;
  },

  issueBook: async (data: IssueBookRequest): Promise<BookIssue> => {
    const res = await apiClient.post<ApiResponse<BookIssue>>('/library/issue', null, {
      params: {
        bookId: data.bookId,
        studentId: data.studentId,
        dueDate: data.dueDate,
      },
    });
    return res.data.data;
  },

  returnBook: async (issueId: number): Promise<BookIssue> => {
    const res = await apiClient.patch<ApiResponse<BookIssue>>(`/library/return/${issueId}`);
    return res.data.data;
  },

  getIssuedBooks: async (studentId: number): Promise<BookIssue[]> => {
    const res = await apiClient.get<ApiResponse<BookIssue[]>>(
      `/library/student/${studentId}/issued`,
    );
    return res.data.data;
  },

  getBookHistory: async (studentId: number): Promise<BookIssue[]> => {
    const res = await apiClient.get<ApiResponse<BookIssue[]>>(
      `/library/student/${studentId}/history`,
    );
    return res.data.data;
  },
};
