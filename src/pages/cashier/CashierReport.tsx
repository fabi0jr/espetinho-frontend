import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../services/reports.api';
import type { CashierPeriod, PaymentSummary } from '../../services/reports.api';

const PERIOD_LABEL: Record<CashierPeriod, string> = {
  today: 'Hoje',
  week:  'Semana',
  month: 'Mês',
};

const METHOD_LABEL: Record<string, string> = {
  PIX:      'PIX',
  DINHEIRO: 'Dinheiro',
  DEBITO:   'Débito',
  CREDITO:  'Crédito',
};

const METHOD_CLASS: Record<string, string> = {
  PIX:      'cashier-badge--pix',
  DINHEIRO: 'cashier-badge--dinheiro',
  DEBITO:   'cashier-badge--debito',
  CREDITO:  'cashier-badge--credito',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit',
  });
}

export function CashierReport() {
  const [period, setPeriod] = useState<CashierPeriod>('today');
  const [data, setData]     = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = useCallback(async (p: CashierPeriod) => {
    setLoading(true);
    setError('');
    try {
      const { data: summary } = await reportsApi.paymentSummary(p);
      setData(summary);
    } catch {
      setError('Erro ao carregar relatório de caixa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period]);

  return (
    <div className="cashier-report">

      <div className="cashier-report-periods">
        {(['today', 'week', 'month'] as CashierPeriod[]).map((p) => (
          <button
            key={p}
            className={period === p ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : data && (
        <>
          <div className="cashier-report-totals">
            {data.totals.length === 0 ? (
              <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
                Nenhum pagamento registrado neste período.
              </p>
            ) : (
              <>
                {data.totals.map((t) => (
                  <div key={t.method} className="cashier-total-card">
                    <span className={`cashier-total-method cashier-method-badge ${METHOD_CLASS[t.method] ?? ''}`}>
                      {METHOD_LABEL[t.method] ?? t.method}
                    </span>
                    <span className="cashier-total-amount">
                      R$ {t.amount.toFixed(2)}
                    </span>
                    <span className="cashier-total-count">
                      {t.count} {t.count === 1 ? 'transação' : 'transações'}
                    </span>
                  </div>
                ))}
                <div className="cashier-total-card cashier-total-card--grand">
                  <span className="cashier-total-method">Total geral</span>
                  <span className="cashier-total-amount cashier-total-amount--grand">
                    R$ {data.totalAmount.toFixed(2)}
                  </span>
                  <span className="cashier-total-count">
                    {data.orders.length} {data.orders.length === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>
              </>
            )}
          </div>

          {data.orders.length === 0 ? (
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
              Nenhum pedido fechado neste período.
            </p>
          ) : (
            <div className="cashier-orders-list">
              <p className="cashier-orders-list-label">Pedidos fechados</p>
              {data.orders.map((order) => (
                <div key={order.id} className="cashier-order-row">
                  <span className="cashier-order-mesa">Mesa {order.tableNumber}</span>
                  <span className="cashier-order-time">
                    {period === 'today'
                      ? formatTime(order.closedAt)
                      : formatDate(order.closedAt)}
                  </span>
                  <div className="cashier-order-badges">
                    {order.payments.map((p, i) => (
                      <span
                        key={i}
                        className={`cashier-method-badge ${METHOD_CLASS[p.method] ?? ''}`}
                      >
                        {METHOD_LABEL[p.method] ?? p.method}
                      </span>
                    ))}
                  </div>
                  <span className="cashier-order-total">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
