import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const { data } = await authApi.updateMe({
        name: profileForm.name,
        email: profileForm.email,
      });
      updateUser({ name: data.name, email: data.email });
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.message ?? 'Erro ao atualizar perfil');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSave(e: FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    setPwLoading(true);
    try {
      await authApi.updatePassword(pwForm);
      setPwForm({ currentPassword: '', password: '', confirmPassword: '' });
      setPwSuccess(true);
    } catch (err: any) {
      setPwError(err.response?.data?.message ?? 'Erro ao alterar senha');
    } finally {
      setPwLoading(false);
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="page-card"
        style={{ width: '100%', maxWidth: 440, padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Meu perfil</h2>
          <button
            className="btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '0.25rem' }}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Seção: Dados pessoais */}
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dados pessoais
        </p>
        {profileError && <p className="error-message" style={{ marginBottom: '0.75rem' }}>{profileError}</p>}
        {profileSuccess && <p style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Perfil atualizado.</p>}
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <input
            className="field-input"
            placeholder="Nome"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            required
            minLength={2}
          />
          <input
            className="field-input"
            type="email"
            placeholder="E-mail"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary btn-sm" disabled={profileLoading} style={{ alignSelf: 'flex-end' }}>
            {profileLoading ? 'Salvando...' : 'Salvar dados'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{ borderTop: '1px solid var(--glass-border)', marginBottom: '1.5rem' }} />

        {/* Seção: Alterar senha */}
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Alterar senha
        </p>
        {pwError && <p className="error-message" style={{ marginBottom: '0.75rem' }}>{pwError}</p>}
        {pwSuccess && <p style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Senha alterada com sucesso.</p>}
        <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <input
            className="field-input"
            type="password"
            placeholder="Senha atual"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
            minLength={6}
          />
          <input
            className="field-input"
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            value={pwForm.password}
            onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
            required
            minLength={6}
          />
          <input
            className="field-input"
            type="password"
            placeholder="Confirmar nova senha"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            required
            minLength={6}
          />
          <button type="submit" className="btn-primary btn-sm" disabled={pwLoading} style={{ alignSelf: 'flex-end' }}>
            {pwLoading ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
