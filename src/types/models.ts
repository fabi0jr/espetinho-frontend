export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  received: number | null;
  createdAt: string;
}

export interface Table {
  id: string;
  number: number;
  status: 'LIVRE' | 'OCUPADA';
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: { name: string; category?: string };
  quantity: number;
  unitPrice: number;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  tableId: string;
  table: { number: number };
  status: 'ABERTO' | 'ENVIADO' | 'PRONTO' | 'FECHADO';
  items: OrderItem[];
  payments?: Payment[];
  openedById: string;
  closedById: string | null;
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
}
