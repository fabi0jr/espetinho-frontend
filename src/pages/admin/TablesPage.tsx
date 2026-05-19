import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
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

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Mesas</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="page-card">
        <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>
          Adicionar mesa
        </h3>
        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
        >
          <div>
            <label className="field-label">Número</label>
            <input
              className="field-input"
              type="number"
              min="1"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              style={{ width: '100px' }}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Salvando...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => (
            <div key={table.id} className={`table-card table-${table.status.toLowerCase()}`}>
              <span className="table-number">Mesa {table.number}</span>
              <span className={`status-badge status-${table.status.toLowerCase()}`}>
                {table.status}
              </span>
              {table.status === 'LIVRE' && (
                <button
                  className="btn-danger btn-sm"
                  onClick={() => handleRemove(table.id)}
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
