import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Trash2, Grid3X3 } from 'lucide-react';
import { tablesApi } from '../../services/tables.api';
import type { Table } from '../../types/models';

export function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [number, setNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTables(); }, []);

  async function loadTables() {
    try {
      const { data } = await tablesApi.list();
      setTables(data);
    } catch {
      setError('Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await tablesApi.create({ number: parseInt(number) });
      setTables((prev) => [...prev, data].sort((a, b) => a.number - b.number));
      setNumber('');
    } catch {
      setError('Erro ao criar mesa. Verifique se o número já existe.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover esta mesa?')) return;
    try {
      await tablesApi.remove(id);
      setTables((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Não é possível remover mesa ocupada');
    }
  }

  const livres   = tables.filter((t) => t.status === 'LIVRE').length;
  const ocupadas = tables.filter((t) => t.status === 'OCUPADA').length;

  return (
    <div className="page-wrapper">
      <div className="tables-page-body">

        <div className="tables-page-header">
          <h1 className="page-title">Mesas</h1>
          {!loading && tables.length > 0 && (
            <div className="tables-summary">
              <span className="tables-summary-item tables-summary-livre">
                {livres} livre{livres !== 1 ? 's' : ''}
              </span>
              <span className="tables-summary-sep">·</span>
              <span className="tables-summary-item tables-summary-ocupada">
                {ocupadas} ocupada{ocupadas !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="page-card">
          <h3 className="card-section-title">Adicionar mesa</h3>
          <form onSubmit={handleCreate} className="tables-add-form">
            <div className="form-field form-field--xs">
              <label className="field-label">Número</label>
              <input
                className="field-input"
                type="number"
                min="1"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary tables-add-btn">
              {submitting ? 'Salvando...' : '+ Adicionar'}
            </button>
          </form>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
        ) : tables.length === 0 ? (
          <div className="menu-empty">
            <div className="menu-empty-icon">
              <Grid3X3 size={34} strokeWidth={1.3} />
            </div>
            <h2>Nenhuma mesa cadastrada</h2>
            <p>Adicione mesas usando o formulário acima.</p>
          </div>
        ) : (
          <div className="tables-admin-grid">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`tables-admin-card tables-admin-card--${table.status.toLowerCase()}`}
              >
                <span className="tables-admin-num">{table.number}</span>
                <span className={`status-badge status-${table.status.toLowerCase()}`}>
                  {table.status === 'LIVRE' ? 'Livre' : 'Ocupada'}
                </span>
                {table.status === 'LIVRE' && (
                  <button
                    className="tables-admin-remove"
                    title="Remover mesa"
                    onClick={() => handleRemove(table.id)}
                  >
                    <Trash2 size={13} strokeWidth={1.9} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
