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

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const socket = io(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/events`,
      { auth: { token } },
    );
    socketRef.current = socket;

    if (callbacks.onOrderCreated) socket.on('order.created', callbacks.onOrderCreated);
    if (callbacks.onItemAdded) socket.on('order.item_added', callbacks.onItemAdded);
    if (callbacks.onOrderSent) socket.on('order.sent', callbacks.onOrderSent);
    if (callbacks.onOrderReady) socket.on('order.ready', callbacks.onOrderReady);
    if (callbacks.onOrderClosed) socket.on('order.closed', callbacks.onOrderClosed);

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { socket: socketRef.current };
}
