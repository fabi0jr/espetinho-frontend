import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ChefHat } from 'lucide-react';
import { ordersApi } from '../../services/orders.api';
import { useSocket } from '../../hooks/useSocket';
import type { Order } from '../../types/models';

function useElapsedMinutes(openedAt: string): number {
  const [minutes, setMinutes] = useState(() =>
    Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setMinutes(Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000));
    }, 30000);
    return () => clearInterval(id);
  }, [openedAt]);
  return minutes;
}

function urgencyClass(minutes: number): string {
  if (minutes >= 10) return 'kitchen-timer--hot';
  if (minutes >= 5) return 'kitchen-timer--warm';
  return 'kitchen-timer--cool';
}

function ElapsedTimer({ openedAt }: { openedAt: string }) {
  const minutes = useElapsedMinutes(openedAt);
  const label = minutes < 1 ? 'agora' : `${minutes} min`;
  return <span className={`kitchen-timer ${urgencyClass(minutes)}`}>{label}</span>;
}

export function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.list({ status: 'ENVIADO' });
      setOrders([...data].sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()));
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
    setMarkingId(orderId);
    try {
      await ordersApi.markReady(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      setError('Erro ao marcar pedido como pronto');
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="kitchen-header">
        <h1 className="page-title">Cozinha</h1>
        {!loading && (
          <span className="kitchen-queue-count">
            {orders.length > 0 ? `${orders.length} pedido${orders.length > 1 ? 's' : ''} na fila` : 'Fila vazia'}
          </span>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="kitchen-empty">
          <div className="kitchen-empty-icon">
            <ChefHat size={40} strokeWidth={1.3} />
          </div>
          <h2>Tudo em dia!</h2>
          <p>Nenhum pedido aguardando preparo.<br />Novos pedidos aparecem aqui automaticamente.</p>
        </div>
      ) : (
        <div className="kitchen-grid">
          {orders.map((order) => (
            <div key={order.id} className="kitchen-card">
              <div className="kitchen-card-top">
                <span className="kitchen-mesa">Mesa {order.table.number}</span>
                <ElapsedTimer openedAt={order.openedAt} />
              </div>

              <ul className="kitchen-items">
                {order.items.map((item) => (
                  <li key={item.id} className="kitchen-item">
                    <span className="kitchen-qty">{item.quantity}×</span>
                    <span className="kitchen-item-name">{item.menuItem.name}</span>
                    {item.note && <span className="kitchen-item-note">{item.note}</span>}
                  </li>
                ))}
              </ul>

              <button
                className="btn-kitchen-ready"
                onClick={() => handleReady(order.id)}
                disabled={markingId === order.id}
              >
                {markingId === order.id ? 'Marcando...' : '✓ Pronto'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
