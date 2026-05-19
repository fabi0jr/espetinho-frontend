import api from './api';
import type { Table } from '../types/models';

export const tablesApi = {
  list: () => api.get<Table[]>('/tables'),
  create: (data: { number: number }) => api.post<Table>('/tables', data),
  release: (id: string) => api.patch(`/tables/${id}/release`),
  remove: (id: string) => api.delete(`/tables/${id}`),
};
