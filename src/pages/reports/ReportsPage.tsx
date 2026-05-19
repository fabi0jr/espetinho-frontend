import { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { reportsApi } from '../../services/reports.api';
import type { ReportPeriod, ReportSummary } from '../../services/reports.api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STATUS_LABEL: Record<string, string> = {
  ABERTO:  'Rascunho',
  ENVIADO: 'Na cozinha',
  PRONTO:  'Pronto',
  FECHADO: 'Fechado',
};

const STATUS_CLASS: Record<string, string> = {
  ABERTO:  'status-aberto',
  ENVIADO: 'status-enviado',
  PRONTO:  'status-pronto',
  FECHADO: 'status-fechado',
};

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (p: ReportPeriod) => {
    setLoading(true);
    setError('');
    try {
      const { data: summary } = await reportsApi.summary(p);
      setData(summary);
    } catch {
      setError('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period]);

  const chartData = {
    labels: data?.dailyRevenue.map((d) => {
      const [, month, day] = d.date.split('-');
      return `${day}/${month}`;
    }) ?? [],
    datasets: [{
      label: 'Faturamento (R$)',
      data: data?.dailyRevenue.map((d) => d.revenue) ?? [],
      backgroundColor: 'rgba(249, 115, 22, 0.75)',
      borderColor: '#f97316',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) =>
            `R$ ${Number(ctx.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: unknown) => `R$ ${value}`,
          color: 'rgba(255,255,255,0.5)',
        },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.5)' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Relatórios</h1>

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['week', 'month'] as const).map((p) => (
          <button
            key={p}
            className={period === p ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setPeriod(p)}
          >
            {p === 'week' ? 'Esta semana' : 'Este mês'}
          </button>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : data && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="page-card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Faturamento Total
              </p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)' }}>
                R$ {data.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="page-card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Ticket Médio
              </p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--blue)' }}>
                R$ {data.averageTicket.toFixed(2)}
              </p>
            </div>
            <div className="page-card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Pedidos Fechados
              </p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--orange)' }}>
                {data.totalClosedOrders}
              </p>
            </div>
          </div>

          {/* Gráfico de faturamento por dia */}
          <div className="page-card" style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              Faturamento por dia
            </p>
            {data.dailyRevenue.length === 0 ? (
              <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
                Nenhum pedido fechado no período.
              </p>
            ) : (
              <div style={{ height: '280px' }}>
                <Bar data={chartData} options={chartOptions as never} />
              </div>
            )}
          </div>

          {/* Linha inferior: top itens + pedidos por status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="page-card">
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                Itens mais vendidos
              </p>
              {data.topItems.length === 0 ? (
                <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Sem dados no período.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-2)' }}>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500, textAlign: 'left' }}>Item</th>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500, textAlign: 'right' }}>Qtd</th>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topItems.map((item, i) => (
                      <tr key={item.menuItemId} style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.45rem 0' }}>
                          <span style={{ color: 'var(--text-2)', marginRight: '0.4rem' }}>{i + 1}.</span>
                          {item.name}
                        </td>
                        <td style={{ padding: '0.45rem 0', textAlign: 'right', color: 'var(--text-2)' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '0.45rem 0', textAlign: 'right', color: 'var(--green)' }}>
                          R$ {item.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="page-card">
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                Pedidos por status
              </p>
              {data.ordersByStatus.length === 0 ? (
                <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Sem dados no período.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {data.ordersByStatus.map((s) => (
                    <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`status-badge ${STATUS_CLASS[s.status] ?? ''}`}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                      <span style={{ fontWeight: 600 }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
