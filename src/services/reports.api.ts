import api from './api';

export type ReportPeriod = 'week' | 'month';

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
};
