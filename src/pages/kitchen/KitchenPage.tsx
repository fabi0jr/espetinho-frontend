import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ordersApi } from '../../services/orders.api';
import { useSocket } from '../../hooks/useSocket';
import type { Order } from '../../types/models';

export function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.list({ status: 'ENVIADO' });
      setOrders(data);
    } catch {
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useSocket({
    onOrderSent: ({ tableNumber }) => {
      loadOrders();
      toast.info(`Mesa ${tableNumber} — novo pedido para preparar`);
    },
    onOrderClosed: () => loadOrders(),
  });

  async function handleReady(orderId: string) {
    try {
      await ordersApi.markReady(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      setError('Erro ao marcar pedido como pronto');
    }
  }

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Cozinha</h1>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="welcome-card">
          <h1>Nenhum pedido em espera</h1>
          <p>Novos pedidos aparecem aqui automaticamente assim que o garçom enviar.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <span className="order-table">Mesa {order.table.number}</span>
                <span className="order-time">
                  {new Date(order.openedAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <ul className="order-items-list">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span className="order-qty">{item.quantity}×</span>
                    <span>{item.menuItem.name}</span>
                    {item.note && <span className="item-note">{item.note}</span>}
                  </li>
                ))}
              </ul>
              <button className="btn-primary btn-ready" onClick={() => handleReady(order.id)}>
                Marcar como Pronto
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
