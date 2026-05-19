import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { ordersApi } from '../services/orders.api';
import type { Order, PaymentMethod } from '../types/models';
import type { PaymentInput } from '../services/orders.api';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX',      label: 'PIX' },
  { value: 'DEBITO',   label: 'Débito' },
  { value: 'CREDITO',  label: 'Crédito' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
];

// Para DINHEIRO, `amount` representa o valor físico recebido do cliente.
// O troco é calculado globalmente: totalDinheiro - (total - pagoEmOutros)
type PaymentRow = { method: PaymentMethod; amount: string };
const emptyRow = (): PaymentRow => ({ method: 'PIX', amount: '' });

function orderTotal(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  );
}

interface Props {
  order: Order;
  onClose: () => void;
  onConfirmed: (orderId: string) => void;
}

export function CloseOrderModal({ order, onClose, onConfirmed }: Props) {
  const [rows, setRows] = useState<PaymentRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = orderTotal(order);

  function updateRow(i: number, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, amount: value } : r)));
  }

  function updateMethod(i: number, method: PaymentMethod) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, method } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Quanto foi pago em métodos não-dinheiro
  const nonCashPaid = rows
    .filter((r) => r.method !== 'DINHEIRO')
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  // Quanto dinheiro físico o cliente entregou no total
  const totalDinheiroReceived = rows
    .filter((r) => r.method === 'DINHEIRO')
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  // Quanto do total ainda precisa ser coberto por dinheiro
  const cashOwed = Math.max(0, total - nonCashPaid);

  // Quanto efetivamente é pago (dinheiro cobre no máximo cashOwed)
  const effectivePaid = nonCashPaid + Math.min(totalDinheiroReceived, cashOwed);
  const pct = Math.min(100, (effectivePaid / total) * 100);

  // Troco = dinheiro recebido menos a parte em dinheiro da conta
  const troco = totalDinheiroReceived - cashOwed;

  const canConfirm = effectivePaid >= total && !submitting;

  async function handleConfirm() {
    setError('');
    setSubmitting(true);
    try {
      const nonCashRows = rows.filter((r) => r.method !== 'DINHEIRO' && parseFloat(r.amount) > 0);
      const dinheiroRows = rows.filter((r) => r.method === 'DINHEIRO' && parseFloat(r.amount) > 0);

      // Para DINHEIRO: amount = parcela que cobre a conta, received = valor físico entregue
      const nonCashTotal = nonCashRows.reduce((s, r) => s + parseFloat(r.amount), 0);
      const cashOwedFinal = Math.max(0, total - nonCashTotal);

      const payments: PaymentInput[] = [
        ...nonCashRows.map((r) => ({ method: r.method, amount: parseFloat(r.amount) })),
        ...dinheiroRows.map((r) => ({
          method: 'DINHEIRO' as PaymentMethod,
          amount: parseFloat(r.amount) > cashOwedFinal ? cashOwedFinal : parseFloat(r.amount),
          received: parseFloat(r.amount),
        })),
      ];

      await ordersApi.close(order.id, payments);
      onConfirmed(order.id);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao fechar conta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  const modal = (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">

        <div className="modal-header">
          <span className="modal-title">Fechar Conta — Mesa {order.table.number}</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="modal-body">
          {error && <p className="error-message">{error}</p>}

          <div className="modal-summary">
            <p className="modal-block-label">Resumo do pedido</p>
            <div className="modal-summary-items">
              {order.items.map((item) => (
                <div key={item.id} className="modal-summary-row">
                  <span>
                    <span className="modal-summary-qty">{item.quantity}×</span>
                    {item.menuItem.name}
                  </span>
                  <span>R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr className="modal-divider" />
            <div className="modal-summary-total">
              <span>Total</span>
              <span className="modal-total-value">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="modal-payments">
            <p className="modal-block-label">Pagamento</p>

            {rows.map((row, i) => (
              <div key={i} className="modal-payment-row">
                <select
                  className="field-input modal-method-select"
                  value={row.method}
                  onChange={(e) => updateMethod(i, e.target.value as PaymentMethod)}
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <input
                  className="field-input modal-amount-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={row.method === 'DINHEIRO' ? 'Valor recebido' : 'R$ 0,00'}
                  value={row.amount}
                  onChange={(e) => updateRow(i, e.target.value)}
                />

                {rows.length > 1 && (
                  <button
                    className="modal-remove-row"
                    onClick={() => removeRow(i)}
                    title="Remover linha"
                  >
                    <Trash2 size={13} strokeWidth={1.9} />
                  </button>
                )}
              </div>
            ))}

            {troco > 0 && (
              <div className="modal-troco">
                <span className="modal-troco-label">Troco para o cliente</span>
                <span className="modal-troco-value">R$ {troco.toFixed(2)}</span>
              </div>
            )}

            <button className="modal-add-row" onClick={addRow}>
              <Plus size={13} strokeWidth={2} />
              Adicionar outra forma
            </button>

            <div className="modal-progress">
              <div className="modal-progress-track">
                <div
                  className={`modal-progress-fill ${effectivePaid >= total ? 'modal-progress-ok' : 'modal-progress-partial'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="modal-progress-meta">
                <span className={effectivePaid >= total ? 'modal-meta-ok' : 'modal-meta-pending'}>
                  {effectivePaid === 0 ? 'Aguardando pagamento...' : `Pago: R$ ${effectivePaid.toFixed(2)}`}
                </span>
                {effectivePaid > 0 && effectivePaid < total && (
                  <span className="modal-meta-remaining">
                    Faltam: R$ {(total - effectivePaid).toFixed(2)}
                  </span>
                )}
                {effectivePaid >= total && (
                  <span className="modal-meta-ok">✓ Valor coberto</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost modal-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-kitchen-ready modal-btn-confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {submitting ? 'Fechando...' : 'Confirmar Fechamento'}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
