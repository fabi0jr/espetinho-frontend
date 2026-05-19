import api from './api';
import type { Table } from '../types/models';

export const tablesApi = {
  list: () => api.get<Table[]>('/tables'),
  create: (data: { number: number }) => api.post<Table>('/tables', data),
  remove: (id: string) => api.delete(`/tables/${id}`),
};
