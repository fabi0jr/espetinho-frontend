import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tablesApi } from '../../services/tables.api';
import { ordersApi } from '../../services/orders.api';
import { menuApi } from '../../services/menu.api';
import { useSocket } from '../../hooks/useSocket';
import type { Table, Order, MenuItem } from '../../types/models';

export function OrdersPage() {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState({ menuItemId: '', quantity: '1', note: '' });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const [tablesRes, ordersRes, menuRes] = await Promise.all([
      tablesApi.list(),
      ordersApi.list({ status: 'ABERTO' }),
      menuApi.list(true),
    ]);
    setTables(tablesRes.data);
    setOrders(ordersRes.data);
    setMenuItems(menuRes.data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useSocket({
    onOrderCreated: () => loadData(),
    onOrderClosed: () => { loadData(); setSelectedTable(null); setActiveOrder(null); },
  });

  async function handleSelectTable(table: Table) {
    setSelectedTable(table);
    setError('');
    if (table.status === 'OCUPADA') {
      const existing = orders.find((o) => o.tableId === table.id);
      if (existing) {
        const { data } = await ordersApi.get(existing.id);
        setActiveOrder(data);
      }
    } else {
      setActiveOrder(null);
    }
  }

  async function handleOpenOrder() {
    if (!selectedTable) return;
    try {
      const { data } = await ordersApi.create(selectedTable.id);
      setActiveOrder(data);
      await loadData();
    } catch {
      setError('Erro ao abrir pedido');
    }
  }

  async function handleAddItem() {
    if (!activeOrder || !itemForm.menuItemId) return;
    setAddingItem(true);
    try {
      await ordersApi.addItem(activeOrder.id, {
        menuItemId: itemForm.menuItemId,
        quantity: parseInt(itemForm.quantity),
        note: itemForm.note || undefined,
      });
      const { data } = await ordersApi.get(activeOrder.id);
      setActiveOrder(data);
      setItemForm({ menuItemId: '', quantity: '1', note: '' });
    } catch {
      setError('Erro ao adicionar item');
    } finally {
      setAddingItem(false);
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

      <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Mesas</h3>
          <div className="tables-grid">
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

        <div>
          {selectedTable && (
            <div className="page-card">
              <h3 style={{ marginBottom: '1rem' }}>Mesa {selectedTable.number}</h3>

              {error && <p className="error-message" style={{ marginBottom: '0.75rem' }}>{error}</p>}

              {selectedTable.status === 'LIVRE' && (
                <button className="btn-primary" onClick={handleOpenOrder}>
                  Abrir Pedido
                </button>
              )}

              {activeOrder && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      ITENS DO PEDIDO
                    </h4>
                    {activeOrder.items.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum item ainda</p>
                    ) : (
                      activeOrder.items.map((item) => (
                        <div key={item.id} className="order-item-row">
                          <span>{item.quantity}× {item.menuItem.name}</span>
                          <span>R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                          {item.note && <span className="item-note">{item.note}</span>}
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      ADICIONAR ITEM
                    </h4>
                    <select
                      className="field-input"
                      value={itemForm.menuItemId}
                      onChange={(e) => setItemForm({ ...itemForm, menuItemId: e.target.value })}
                      style={{ marginBottom: '0.5rem', width: '100%' }}
                    >
                      <option value="">Selecione um item</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — R$ {Number(m.price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                      />
                      <button
                        className="btn-primary"
                        onClick={handleAddItem}
                        disabled={addingItem || !itemForm.menuItemId}
                      >
                        {addingItem ? '...' : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
