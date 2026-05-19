import axios from 'axios';
import type { LoginCredentials, LoginResponse, RefreshResponse } from '../types/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>('/auth/login', credentials),

  refresh: () =>
    api.post<RefreshResponse>('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get<{ id: string; name: string; email: string; roles: string[]; mustChangePassword: boolean }>('/auth/me'),

  changePassword: (password: string, confirmPassword: string) =>
    api.patch('/auth/change-password', { password, confirmPassword }),

  updateMe: (dto: { name?: string; email?: string }) =>
    api.patch<{ id: string; name: string; email: string; roles: string[]; mustChangePassword: boolean }>('/auth/me', dto),

  updatePassword: (dto: { currentPassword: string; password: string; confirmPassword: string }) =>
    api.patch<{ message: string }>('/auth/update-password', dto),
};

export default api;
