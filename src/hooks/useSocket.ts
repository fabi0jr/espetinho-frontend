import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface OrderCreatedPayload {
  orderId: string;
  tableNumber: number;
  status: string;
}
interface ItemAddedPayload {
  orderId: string;
  tableNumber: number;
  item: { name: string; quantity: number; note: string | null };
}
interface OrderSentPayload { orderId: string; tableNumber: number }
interface OrderReadyPayload { orderId: string; tableNumber: number }
interface OrderClosedPayload { orderId: string; tableNumber: number }

interface UseSocketCallbacks {
  onOrderCreated?: (data: OrderCreatedPayload) => void;
  onItemAdded?: (data: ItemAddedPayload) => void;
  onOrderSent?: (data: OrderSentPayload) => void;
  onOrderReady?: (data: OrderReadyPayload) => void;
  onOrderClosed?: (data: OrderClosedPayload) => void;
}

export function useSocket(callbacks: UseSocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const cbRef = useRef(callbacks);

  // Mantém sempre a versão mais recente dos callbacks sem reconectar o socket
  useEffect(() => {
    cbRef.current = callbacks;
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const socket = io(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/events`,
      { auth: { token } },
    );
    socketRef.current = socket;

    socket.on('order.created',    (d) => cbRef.current.onOrderCreated?.(d));
    socket.on('order.item_added', (d) => cbRef.current.onItemAdded?.(d));
    socket.on('order.sent',       (d) => cbRef.current.onOrderSent?.(d));
    socket.on('order.ready',      (d) => cbRef.current.onOrderReady?.(d));
    socket.on('order.closed',     (d) => cbRef.current.onOrderClosed?.(d));

    return () => { socket.disconnect(); };
  }, []);

  return { socket: socketRef.current };
}
