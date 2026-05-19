import api from './api';
import type { Role } from '../types/auth';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export const usersApi = {
  list: (isActive?: boolean) =>
    api.get<UserRecord[]>(
      `/users${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    ),

  create: (dto: { name: string; email: string; password: string; roles: Role[] }) =>
    api.post<UserRecord>('/users', dto),

  update: (id: string, dto: { name?: string; email?: string; roles?: Role[] }) =>
    api.patch<UserRecord>(`/users/${id}`, dto),

  activate: (id: string) =>
    api.patch<UserRecord>(`/users/${id}/activate`),

  deactivate: (id: string) =>
    api.patch<UserRecord>(`/users/${id}/deactivate`),

  resetPassword: (id: string, password: string) =>
    api.patch(`/users/${id}/reset-password`, { password }),
};
