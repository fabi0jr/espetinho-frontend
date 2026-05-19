import api from './api';
import type { Order } from '../types/models';

export const ordersApi = {
  list: (params?: { status?: string; tableId?: string }) =>
    api.get<Order[]>('/orders', { params }),

  get: (id: string) => api.get<Order>(`/orders/${id}`),

  create: (tableId: string) => api.post<Order>('/orders', { tableId }),

  remove: (orderId: string) => api.delete(`/orders/${orderId}`),

  addItem: (
    orderId: string,
    data: { menuItemId: string; quantity: number; note?: string },
  ) => api.post(`/orders/${orderId}/items`, data),

  sendToKitchen: (orderId: string) => api.patch(`/orders/${orderId}/send`),

  markReady: (orderId: string) => api.patch(`/orders/${orderId}/ready`),

  close: (orderId: string) => api.patch(`/orders/${orderId}/close`),
};
