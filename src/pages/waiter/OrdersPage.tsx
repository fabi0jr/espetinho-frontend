import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tablesApi } from '../../services/tables.api';
import { ordersApi } from '../../services/orders.api';
import { menuApi } from '../../services/menu.api';
import { useSocket } from '../../hooks/useSocket';
import type { Table, Order, MenuItem } from '../../types/models';

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Rascunho',
  ENVIADO: 'Na cozinha',
  PRONTO: 'Pronto',
};

const STATUS_CLASS: Record<string, string> = {
  ABERTO: 'status-aberto',
  ENVIADO: 'status-enviado',
  PRONTO: 'status-pronto',
};

export function OrdersPage() {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ menuItemId: '', quantity: '1', note: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [error, setError] = useState('');

  const loadTables = useCallback(async () => {
    const { data } = await tablesApi.list();
    setTables(data);
  }, []);

  const loadTableOrders = useCallback(async (tableId: string) => {
    const { data } = await ordersApi.list({ tableId });
    setTableOrders(data.filter((o) => o.status !== 'FECHADO'));
  }, []);

  const loadMenuItems = useCallback(async () => {
    const { data } = await menuApi.list(true);
    setMenuItems(data);
  }, []);

  useEffect(() => {
    loadTables();
    loadMenuItems();
  }, [loadTables, loadMenuItems]);

  const selectedTableRef = { current: selectedTable };
  selectedTableRef.current = selectedTable;

  useSocket({
    onOrderCreated: () => {
      loadTables();
      if (selectedTableRef.current) loadTableOrders(selectedTableRef.current.id);
    },
    onOrderSent: () => {
      if (selectedTableRef.current) loadTableOrders(selectedTableRef.current.id);
    },
    onOrderClosed: () => {
      loadTables();
      if (selectedTableRef.current) loadTableOrders(selectedTableRef.current.id);
    },
  });

  async function handleSelectTable(table: Table) {
    setSelectedTable(table);
    setError('');
    setExpandedOrderId(null);
    await loadTableOrders(table.id);
  }

  async function handleOpenOrder() {
    if (!selectedTable) return;
    setError('');
    try {
      const { data } = await ordersApi.create(selectedTable.id);
      await loadTables();
      setTableOrders((prev) => [data, ...prev]);
      setExpandedOrderId(data.id);
      setItemForm({ menuItemId: '', quantity: '1', note: '' });
    } catch {
      setError('Erro ao abrir pedido');
    }
  }

  async function handleAddItem(orderId: string) {
    if (!itemForm.menuItemId) return;
    setAddingItem(true);
    setError('');
    try {
      await ordersApi.addItem(orderId, {
        menuItemId: itemForm.menuItemId,
        quantity: parseInt(itemForm.quantity),
        note: itemForm.note || undefined,
      });
      const { data } = await ordersApi.get(orderId);
      setTableOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)));
      setItemForm({ menuItemId: '', quantity: '1', note: '' });
    } catch {
      setError('Erro ao adicionar item');
    } finally {
      setAddingItem(false);
    }
  }

  async function handleSendToKitchen(orderId: string) {
    setError('');
    try {
      await ordersApi.sendToKitchen(orderId);
      setTableOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'ENVIADO' as const } : o)),
      );
      setExpandedOrderId(null);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao enviar pedido para a cozinha');
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand"><span>🍢</span><h2>Pedidos</h2></div>
        <div className="header-user">
          <span className="user-role-badge">{user?.role}</span>
          <span className="user-name">{user?.name || user?.email}</span>
          <button className="logout-button" onClick={logout}>Sair</button>
        </div>
      </header>

      <main
        className="dashboard-main"
        style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}
      >
        {/* Coluna de mesas */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Mesas</h3>
          <div className="tables-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {tables.map((table) => (
              <button
                key={table.id}
                className={`table-card table-${table.status.toLowerCase()} ${selectedTable?.id === table.id ? 'table-selected' : ''}`}
                onClick={() => handleSelectTable(table)}
              >
                <span className="table-number">Mesa {table.number}</span>
                <span className={`status-badge status-${table.status.toLowerCase()}`}>
                  {table.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Painel de pedidos */}
        <div>
          {selectedTable ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Mesa {selectedTable.number}</h3>
                <button className="btn-primary" onClick={handleOpenOrder}>+ Novo Pedido</button>
              </div>

              {error && <p className="error-message" style={{ marginBottom: '0.75rem' }}>{error}</p>}

              {tableOrders.length === 0 ? (
                <div className="page-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  Nenhum pedido em andamento.<br />Clique em "Novo Pedido" para começar.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tableOrders.map((order) => (
                    <div key={order.id} className="page-card">
                      {/* Cabeçalho do pedido */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(order.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`status-badge ${STATUS_CLASS[order.status]}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>

                      {/* Itens do pedido */}
                      {(order.items ?? []).length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          Nenhum item ainda
                        </p>
                      ) : (
                        <div style={{ marginBottom: '0.75rem' }}>
                          {order.items.map((item) => (
                            <div key={item.id} className="order-item-row">
                              <span>{item.quantity}× {item.menuItem.name}</span>
                              <span>R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                              {item.note && <span className="item-note">{item.note}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ações — só para pedidos em rascunho */}
                      {order.status === 'ABERTO' && (
                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                          {expandedOrderId === order.id ? (
                            <>
                              <select
                                className="field-input"
                                value={itemForm.menuItemId}
                                onChange={(e) => setItemForm({ ...itemForm, menuItemId: e.target.value })}
                                style={{ width: '100%', marginBottom: '0.5rem' }}
                              >
                                <option value="">Selecione um item</option>
                                {menuItems.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} — R$ {Number(m.price).toFixed(2)}
                                  </option>
                                ))}
                              </select>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <input
                                  className="field-input"
                                  type="number"
                                  min="1"
                                  value={itemForm.quantity}
                                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                                  style={{ width: '70px' }}
                                />
                                <input
                                  className="field-input"
                                  placeholder="Observação"
                                  value={itemForm.note}
                                  onChange={(e) => setItemForm({ ...itemForm, note: e.target.value })}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  className="btn-ghost"
                                  onClick={() => handleAddItem(order.id)}
                                  disabled={addingItem || !itemForm.menuItemId}
                                >
                                  {addingItem ? '...' : '+ Item'}
                                </button>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="btn-primary"
                                  style={{ flex: 1 }}
                                  onClick={() => handleSendToKitchen(order.id)}
                                >
                                  Enviar para Cozinha
                                </button>
                                <button className="btn-ghost" onClick={() => setExpandedOrderId(null)}>
                                  Fechar
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              className="btn-ghost"
                              style={{ width: '100%' }}
                              onClick={() => {
                                setExpandedOrderId(order.id);
                                setItemForm({ menuItemId: '', quantity: '1', note: '' });
                              }}
                            >
                              + Adicionar itens / Enviar para Cozinha
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="page-card" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Selecione uma mesa para gerenciar pedidos
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
