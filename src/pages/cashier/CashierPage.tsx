import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ordersApi } from '../../services/orders.api';
import { useSocket } from '../../hooks/useSocket';
import type { Order } from '../../types/models';

export function CashierPage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.list({ status: 'PRONTO' });
      setOrders(data);
    } catch {
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useSocket({
    onOrderReady: () => loadOrders(),
    onOrderClosed: () => loadOrders(),
  });

  async function handleClose(orderId: string) {
    try {
      await ordersApi.close(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      setError('Erro ao fechar pedido');
    }
  }

  const total = (order: Order) =>
    order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand"><span>💰</span><h2>Caixa</h2></div>
        <div className="header-user">
          <span className="user-role-badge">{user?.role}</span>
          <button className="logout-button" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="welcome-card">
            <h1>Nenhum pedido pronto</h1>
            <p>Pedidos prontos para fechar aparecerão aqui.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order.id} className="order-card order-card-ready">
                <div className="order-card-header">
                  <span className="order-table">Mesa {order.table.number}</span>
                  <span className="order-total">R$ {total(order).toFixed(2)}</span>
                </div>
                <ul className="order-items-list">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span className="order-qty">{item.quantity}×</span>
                      <span>{item.menuItem.name}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                        R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="btn-primary btn-close" onClick={() => handleClose(order.id)}>
                  Fechar Conta
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
