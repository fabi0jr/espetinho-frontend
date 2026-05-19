import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { tablesApi } from '../../services/tables.api';
import { ordersApi } from '../../services/orders.api';
import { menuApi } from '../../services/menu.api';
import { useSocket } from '../../hooks/useSocket';
import type { Table, Order, MenuItem } from '../../types/models';

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Rascunho',
  ENVIADO: 'Na cozinha',
  PRONTO: 'Pronto ✓',
};

const STATUS_CLASS: Record<string, string> = {
  ABERTO: 'status-aberto',
  ENVIADO: 'status-enviado',
  PRONTO: 'status-pronto',
};

type ItemForm = { menuItemId: string; quantity: number; note: string };
const emptyForm = (): ItemForm => ({ menuItemId: '', quantity: 1, note: '' });

/* ── Stepper de quantidade ─────────────────────────── */
function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="qty-stepper">
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        −
      </button>
      <span className="qty-value">{value}</span>
      <button type="button" className="qty-btn" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

/* ── Picker visual de itens do cardápio ────────────── */
function MenuPicker({
  menuItems,
  form,
  onUpdate,
  onAdd,
  adding,
}: {
  menuItems: MenuItem[];
  form: ItemForm;
  onUpdate: (field: keyof ItemForm, value: string | number) => void;
  onAdd: () => void;
  adding: boolean;
}) {
  const categories = [...new Set(menuItems.map((i) => i.category))].sort();
  const selected = menuItems.find((i) => i.id === form.menuItemId);

  return (
    <div className="menu-picker">
      <div className="menu-picker-scroll">
        {categories.map((cat) => (
          <div key={cat} className="menu-picker-section">
            <span className="menu-picker-cat">{cat}</span>
            <div className="menu-picker-chips">
              {menuItems
                .filter((i) => i.category === cat)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`menu-chip ${form.menuItemId === item.id ? 'menu-chip--selected' : ''}`}
                    onClick={() =>
                      onUpdate('menuItemId', form.menuItemId === item.id ? '' : item.id)
                    }
                  >
                    <span className="menu-chip-name">{item.name}</span>
                    <span className="menu-chip-price">
                      R$ {Number(item.price).toFixed(2)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="menu-picker-action">
          <QtyStepper
            value={form.quantity}
            onChange={(v) => onUpdate('quantity', v)}
          />
          <input
            className="field-input menu-picker-note"
            placeholder="Observação (opcional)"
            value={form.note}
            onChange={(e) => onUpdate('note', e.target.value)}
          />
          <button className="btn-primary" onClick={onAdd} disabled={adding}>
            {adding ? '...' : '+ Adicionar'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Página principal ──────────────────────────────── */
export function OrdersPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [itemForms, setItemForms] = useState<Record<string, ItemForm>>({});
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
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

  const selectedTableId = selectedTable?.id;

  useSocket({
    onOrderCreated: () => {
      loadTables();
      if (selectedTableId) loadTableOrders(selectedTableId);
    },
    onOrderSent: () => {
      if (selectedTableId) loadTableOrders(selectedTableId);
    },
    onOrderReady: ({ tableNumber }) => {
      if (selectedTableId) loadTableOrders(selectedTableId);
      toast.success(`Mesa ${tableNumber} — pedido pronto para retirar!`);
    },
    onOrderClosed: () => {
      loadTables();
      if (selectedTableId) loadTableOrders(selectedTableId);
    },
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
      await Promise.all([loadTables(), loadTableOrders(selectedTable.id)]);
      setItemForms((prev) => ({ ...prev, [data.id]: emptyForm() }));
    } catch {
      setError('Erro ao abrir pedido');
    }
  }

  function updateForm(orderId: string, field: keyof ItemForm, value: string | number) {
    setItemForms((prev) => ({
      ...prev,
      [orderId]: { ...(prev[orderId] ?? emptyForm()), [field]: value },
    }));
  }

  async function handleRemoveItem(orderId: string, itemId: string) {
    setError('');
    try {
      await ordersApi.removeItem(orderId, itemId);
      setTableOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, items: o.items.filter((i) => i.id !== itemId) } : o,
        ),
      );
    } catch {
      setError('Erro ao remover item');
    }
  }

  async function handleAddItem(orderId: string) {
    const form = itemForms[orderId] ?? emptyForm();
    if (!form.menuItemId) return;
    setAddingItem(orderId);
    setError('');
    try {
      await ordersApi.addItem(orderId, {
        menuItemId: form.menuItemId,
        quantity: form.quantity,
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
    setSendingId(orderId);
    setError('');
    try {
      await ordersApi.sendToKitchen(orderId);
      setTableOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'ENVIADO' as const } : o)),
      );
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao enviar pedido para a cozinha');
    } finally {
      setSendingId(null);
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
    if (
      !selectedTable ||
      !confirm('Liberar mesa sem consumo? Os rascunhos serão descartados.')
    )
      return;
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

  const canRelease =
    selectedTable?.status === 'OCUPADA' &&
    tableOrders.every((o) => o.status === 'ABERTO');

  const tableButtons = tables.map((table) => (
    <button
      key={table.id}
      className={[
        'waiter-table-btn',
        `waiter-table-btn--${table.status.toLowerCase()}`,
        selectedTable?.id === table.id ? 'waiter-table-btn--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => handleSelectTable(table)}
    >
      <span className="waiter-table-num">{table.number}</span>
      <span className={`status-badge status-${table.status.toLowerCase()}`}>
        {table.status === 'LIVRE' ? 'Livre' : 'Ocupada'}
      </span>
    </button>
  ));

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Pedidos</h1>

      {!selectedTable ? (
        /* ── Sem mesa selecionada: mesas em destaque ── */
        <div className="waiter-select-view">
          <p className="waiter-col-label">Selecione uma mesa</p>
          <div className="waiter-tables-full">{tableButtons}</div>
        </div>
      ) : (
        /* ── Mesa selecionada: layout duas colunas ── */
        <div className="orders-page-grid">
          <div className="waiter-tables-col">
            <p className="waiter-col-label">Mesas</p>
            <div className="waiter-tables-grid">{tableButtons}</div>
          </div>

          <div className="waiter-orders-col">
            <>
              <div className="waiter-panel-header">
                <h3 className="waiter-panel-title">Mesa {selectedTable.number}</h3>
                <div className="waiter-panel-actions">
                  {canRelease && (
                    <button className="btn-ghost btn-release" onClick={handleRelease}>
                      Liberar Mesa
                    </button>
                  )}
                  <button className="btn-primary" onClick={handleOpenOrder}>
                    + Novo Pedido
                  </button>
                </div>
              </div>

              {error && <p className="error-message waiter-error">{error}</p>}

              {tableOrders.length === 0 ? (
                <div className="waiter-empty-panel">
                  Nenhum pedido em andamento.
                  <br />
                  Clique em "Novo Pedido" para começar.
                </div>
              ) : (
                <div className="waiter-orders-list">
                  {tableOrders.map((order) => {
                    const form = itemForms[order.id] ?? emptyForm();
                    const isReady = order.status === 'PRONTO';
                    return (
                      <div
                        key={order.id}
                        className={[
                          'waiter-order-card',
                          isReady ? 'waiter-order-card--pronto' : '',
                          order.status === 'ENVIADO' ? 'waiter-order-card--enviado' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {/* Cabeçalho do card */}
                        <div className="waiter-order-header">
                          <span className="waiter-order-time">
                            {new Date(order.openedAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="waiter-order-header-right">
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

                        {/* Banner de pronto */}
                        {isReady && (
                          <div className="waiter-ready-banner">
                            ✓ Pedido pronto — pode retirar!
                          </div>
                        )}

                        {/* Lista de itens */}
                        {(order.items ?? []).length === 0 ? (
                          <p className="waiter-empty-items">Nenhum item adicionado</p>
                        ) : (
                          <div className="waiter-items-list">
                            {order.items.map((item) => (
                              <div key={item.id} className="order-item-row">
                                <span className="order-qty">{item.quantity}×</span>
                                <span>{item.menuItem.name}</span>
                                <span className="waiter-item-price">
                                  R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                                </span>
                                {item.note && (
                                  <span className="item-note">{item.note}</span>
                                )}
                                {order.status === 'ABERTO' && (
                                  <button
                                    className="btn-danger btn-sm waiter-remove-item"
                                    onClick={() => handleRemoveItem(order.id, item.id)}
                                    title="Remover item"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulário — só rascunhos */}
                        {order.status === 'ABERTO' && (
                          <div className="waiter-add-section">
                            <p className="waiter-add-label">Adicionar item</p>
                            <MenuPicker
                              menuItems={menuItems}
                              form={form}
                              onUpdate={(field, value) => updateForm(order.id, field, value)}
                              onAdd={() => handleAddItem(order.id)}
                              adding={addingItem === order.id}
                            />
                            <button
                              className="btn-send-kitchen"
                              onClick={() => handleSendToKitchen(order.id)}
                              disabled={
                                (order.items ?? []).length === 0 || sendingId === order.id
                              }
                            >
                              {sendingId === order.id
                                ? 'Enviando...'
                                : 'Enviar para Cozinha →'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          </div>
        </div>
      )}
    </div>
  );
}
