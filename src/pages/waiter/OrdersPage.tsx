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

type ItemForm = { menuItemId: string; quantity: string; note: string };
const emptyForm = (): ItemForm => ({ menuItemId: '', quantity: '1', note: '' });

export function OrdersPage() {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  // Formulário de item indexado por orderId — cada rascunho tem o seu
  const [itemForms, setItemForms] = useState<Record<string, ItemForm>>({});
  const [addingItem, setAddingItem] = useState<string | null>(null); // orderId sendo processado
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

  // Ref para usar dentro do useSocket sem causar re-subscribe
  const selectedTableId = selectedTable?.id;

  useSocket({
    onOrderCreated: () => { loadTables(); if (selectedTableId) loadTableOrders(selectedTableId); },
    onOrderSent: () => { if (selectedTableId) loadTableOrders(selectedTableId); },
    onOrderClosed: () => { loadTables(); if (selectedTableId) loadTableOrders(selectedTableId); },
  });

  async function handleSelectTable(table: Table) {
    setSelectedTable(table);
    setError('');
    setItemForms({});
    await loadTableOrders(table.id);
  }

  async function handleOpenOrder() {
    if (!selectedTable) return;
    setError('');
    try {
      const { data } = await ordersApi.create(selectedTable.id);
      await loadTables();
      setTableOrders((prev) => [data, ...prev]);
      setItemForms((prev) => ({ ...prev, [data.id]: emptyForm() }));
    } catch {
      setError('Erro ao abrir pedido');
    }
  }

  function updateForm(orderId: string, field: keyof ItemForm, value: string) {
    setItemForms((prev) => ({
      ...prev,
      [orderId]: { ...(prev[orderId] ?? emptyForm()), [field]: value },
    }));
  }

  async function handleAddItem(orderId: string) {
    const form = itemForms[orderId] ?? emptyForm();
    if (!form.menuItemId) return;
    setAddingItem(orderId);
    setError('');
    try {
      await ordersApi.addItem(orderId, {
        menuItemId: form.menuItemId,
        quantity: parseInt(form.quantity),
        note: form.note || undefined,
      });
      const { data } = await ordersApi.get(orderId);
      setTableOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)));
      setItemForms((prev) => ({ ...prev, [orderId]: emptyForm() }));
    } catch {
      setError('Erro ao adicionar item');
    } finally {
      setAddingItem(null);
    }
  }

  async function handleSendToKitchen(orderId: string) {
    setError('');
    try {
      await ordersApi.sendToKitchen(orderId);
      setTableOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'ENVIADO' as const } : o)),
      );
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao enviar pedido para a cozinha');
    }
  }

  async function handleRemoveDraft(orderId: string) {
    if (!confirm('Excluir este rascunho?')) return;
    setError('');
    try {
      await ordersApi.remove(orderId);
      const remaining = tableOrders.filter((o) => o.id !== orderId);
      setTableOrders(remaining);
      if (remaining.length === 0) await loadTables();
    } catch {
      setError('Erro ao excluir rascunho');
    }
  }

  async function handleRelease() {
    if (!selectedTable || !confirm('Liberar mesa sem consumo? Os rascunhos serão descartados.')) return;
    setError('');
    try {
      await tablesApi.release(selectedTable.id);
      await loadTables();
      setSelectedTable(null);
      setTableOrders([]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao liberar mesa');
    }
  }

  // Mesa pode ser liberada pelo garçom se não houver pedidos ENVIADO ou PRONTO
  const canRelease =
    selectedTable?.status === 'OCUPADA' &&
    tableOrders.every((o) => o.status === 'ABERTO');

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3>Mesa {selectedTable.number}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {canRelease && (
                    <button className="btn-ghost" onClick={handleRelease} style={{ color: '#ff6060', borderColor: 'rgba(255,60,60,0.3)' }}>
                      Liberar Mesa
                    </button>
                  )}
                  <button className="btn-primary" onClick={handleOpenOrder}>+ Novo Pedido</button>
                </div>
              </div>

              {error && <p className="error-message" style={{ marginBottom: '0.75rem' }}>{error}</p>}

              {tableOrders.length === 0 ? (
                <div className="page-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  Nenhum pedido em andamento.<br />Clique em "Novo Pedido" para começar.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tableOrders.map((order) => {
                    const form = itemForms[order.id] ?? emptyForm();
                    return (
                      <div key={order.id} className="page-card">
                        {/* Cabeçalho */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(order.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className={`status-badge ${STATUS_CLASS[order.status]}`}>
                              {STATUS_LABEL[order.status] ?? order.status}
                            </span>
                            {order.status === 'ABERTO' && (
                              <button
                                className="btn-danger btn-sm"
                                onClick={() => handleRemoveDraft(order.id)}
                                title="Excluir rascunho"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lista de itens */}
                        {(order.items ?? []).length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                            Nenhum item adicionado
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

                        {/* Formulário — só para rascunhos */}
                        {order.status === 'ABERTO' && (
                          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                              Adicionar item
                            </p>
                            <select
                              className="field-input"
                              value={form.menuItemId}
                              onChange={(e) => updateForm(order.id, 'menuItemId', e.target.value)}
                              style={{ width: '100%', marginBottom: '0.5rem' }}
                            >
                              <option value="">Selecione um item do cardápio</option>
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
                                value={form.quantity}
                                onChange={(e) => updateForm(order.id, 'quantity', e.target.value)}
                                style={{ width: '70px' }}
                              />
                              <input
                                className="field-input"
                                placeholder="Observação (opcional)"
                                value={form.note}
                                onChange={(e) => updateForm(order.id, 'note', e.target.value)}
                                style={{ flex: 1 }}
                              />
                              <button
                                className="btn-ghost"
                                onClick={() => handleAddItem(order.id)}
                                disabled={addingItem === order.id || !form.menuItemId}
                              >
                                {addingItem === order.id ? '...' : '+ Adicionar'}
                              </button>
                            </div>
                            <button
                              className="btn-primary"
                              style={{ width: '100%' }}
                              onClick={() => handleSendToKitchen(order.id)}
                              disabled={(order.items ?? []).length === 0}
                            >
                              Enviar para Cozinha →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
