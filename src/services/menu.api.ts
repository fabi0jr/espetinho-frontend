import api from './api';
import type { MenuItem } from '../types/models';

export const menuApi = {
  list: (available?: boolean) =>
    api.get<MenuItem[]>('/menu', {
      params: available !== undefined ? { available } : {},
    }),

  create: (data: {
    name: string;
    description?: string;
    price: number;
    category: string;
    imageUrl?: string;
  }) => api.post<MenuItem>('/menu', data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl: string;
      isAvailable: boolean;
    }>,
  ) => api.patch<MenuItem>(`/menu/${id}`, data),

  remove: (id: string) => api.delete(`/menu/${id}`),

  getUploadUrl: (id: string) =>
    api.post<{ url: string; imageUrl: string }>(`/menu/${id}/upload-url`),

  uploadImage: (presignedUrl: string, file: File) =>
    fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    }),
};
