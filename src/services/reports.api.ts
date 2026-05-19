import api from './api';

export type ReportPeriod = 'week' | 'month';
export type CashierPeriod = 'today' | 'week' | 'month';

export interface PaymentTotal {
  method: 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';
  amount: number;
  count: number;
}

export interface ClosedOrderSummary {
  id: string;
  tableNumber: number;
  closedAt: string;
  total: number;
  payments: { method: string; amount: number }[];
}

export interface PaymentSummary {
  period: CashierPeriod;
  totalAmount: number;
  totals: PaymentTotal[];
  orders: ClosedOrderSummary[];
}

export interface TopItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface OrderByStatus {
  status: string;
  count: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  totalRevenue: number;
  averageTicket: number;
  totalClosedOrders: number;
  topItems: TopItem[];
  dailyRevenue: DailyRevenue[];
  ordersByStatus: OrderByStatus[];
}

export const reportsApi = {
  summary: (period: ReportPeriod) =>
    api.get<ReportSummary>(`/reports/summary?period=${period}`),

  paymentSummary: (period: CashierPeriod) =>
    api.get<PaymentSummary>('/reports/payments', { params: { period } }),
};
