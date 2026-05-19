import api from './api';
import type { Order, PaymentMethod } from '../types/models';

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  received?: number;
}

export const ordersApi = {
  list: (params?: { status?: string; tableId?: string }) =>
    api.get<Order[]>('/orders', { params }),

  get: (id: string) => api.get<Order>(`/orders/${id}`),

  create: (tableId: string) => api.post<Order>('/orders', { tableId }),

  remove: (orderId: string) => api.delete(`/orders/${orderId}`),

  removeItem: (orderId: string, itemId: string) =>
    api.delete(`/orders/${orderId}/items/${itemId}`),

  addItem: (
    orderId: string,
    data: { menuItemId: string; quantity: number; note?: string },
  ) => api.post(`/orders/${orderId}/items`, data),

  sendToKitchen: (orderId: string) => api.patch(`/orders/${orderId}/send`),

  markReady: (orderId: string) => api.patch(`/orders/${orderId}/ready`),

  close: (orderId: string, payments: PaymentInput[]) =>
    api.patch<Order>(`/orders/${orderId}/close`, { payments }),
};
