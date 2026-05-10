import { apiClient } from './client';
import { PAGE_SIZE } from '../constants';
import type { ApiResponse, CreateEventRequest, AddEventPhotoRequest } from '../types/api';
import type { SchoolEvent, EventPhoto, Page } from '../types';

export const eventsApi = {
  getAll: async (page = 0, size = PAGE_SIZE): Promise<Page<SchoolEvent>> => {
    const res = await apiClient.get<ApiResponse<Page<SchoolEvent>>>('/events', {
      params: { page, size },
    });
    return res.data.data;
  },

  create: async (data: CreateEventRequest): Promise<SchoolEvent> => {
    const res = await apiClient.post<ApiResponse<SchoolEvent>>('/events', null, {
      params: {
        title: data.title,
        description: data.description,
        eventDate: data.eventDate,
        venue: data.venue,
        publish: data.publish ?? false,
      },
    });
    return res.data.data;
  },

  addPhoto: async (eventId: number, data: AddEventPhotoRequest): Promise<EventPhoto> => {
    const res = await apiClient.post<ApiResponse<EventPhoto>>(
      `/events/${eventId}/photos`,
      null,
      { params: { photoUrl: data.photoUrl, caption: data.caption } },
    );
    return res.data.data;
  },

  getPhotos: async (eventId: number): Promise<EventPhoto[]> => {
    const res = await apiClient.get<ApiResponse<EventPhoto[]>>(`/events/${eventId}/photos`);
    return res.data.data;
  },
};
