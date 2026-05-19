import { useState } from 'react';
import type { FormEvent } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function ChangePasswordModal() {
  const { updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.changePassword(password, confirm);
      updateUser({ mustChangePassword: false });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
    }}>
      <div className="page-card" style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
          Altere sua senha
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Por segurança, defina uma nova senha antes de continuar.
        </p>

        {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            className="field-input"
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
          />
          <input
            className="field-input"
            type="password"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
