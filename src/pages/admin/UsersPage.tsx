import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { usersApi } from '../../services/users.api';
import type { UserRecord } from '../../services/users.api';
import type { Role } from '../../types/auth';

const ROLE_OPTIONS: Role[] = ['ADMIN', 'GARCOM', 'COZINHEIRO', 'CAIXA'];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  GARCOM: 'Garçom',
  COZINHEIRO: 'Cozinheiro',
  CAIXA: 'Caixa',
};

type Filter = 'all' | 'active' | 'inactive';

function RoleCheckboxes({
  selected,
  onChange,
}: {
  selected: Role[];
  onChange: (roles: Role[]) => void;
}) {
  function toggle(role: Role) {
    onChange(
      selected.includes(role)
        ? selected.filter((r) => r !== role)
        : [...selected, role],
    );
  }
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {ROLE_OPTIONS.map((r) => (
        <label
          key={r}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(r)}
            onChange={() => toggle(r)}
          />
          {ROLE_LABEL[r]}
        </label>
      ))}
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['GARCOM'] as Role[],
  });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', roles: [] as Role[] });

  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const isActive =
        filter === 'active' ? true : filter === 'inactive' ? false : undefined;
      const { data } = await usersApi.list(isActive);
      setUsers(data);
    } catch {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (form.roles.length === 0) {
      setError('Selecione ao menos um perfil');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const { data } = await usersApi.create(form);
      setUsers((prev) => [data, ...prev]);
      setForm({ name: '', email: '', password: '', roles: ['GARCOM'] });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(user: UserRecord) {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, roles: user.roles });
    setResetId(null);
  }

  async function handleUpdate(id: string) {
    if (editForm.roles.length === 0) {
      setError('Selecione ao menos um perfil');
      return;
    }
    setError('');
    try {
      const { data } = await usersApi.update(id, editForm);
      setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao atualizar usuário');
    }
  }

  async function handleToggleActive(user: UserRecord) {
    const action = user.isActive ? 'Desativar' : 'Reativar';
    if (!confirm(`${action} ${user.name}?`)) return;
    setError('');
    try {
      const { data } = user.isActive
        ? await usersApi.deactivate(user.id)
        : await usersApi.activate(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao atualizar status');
    }
  }

  async function handleResetPassword(id: string) {
    if (newPassword.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setError('');
    try {
      await usersApi.resetPassword(id, newPassword);
      setResetId(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao redefinir senha');
    }
  }

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Usuários</h1>

      {error && <p className="error-message">{error}</p>}

      {/* Formulário de criação */}
      <div className="page-card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
          Novo usuário
        </p>
        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <input
              className="field-input"
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="field-input"
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="field-input"
              type="password"
              placeholder="Senha inicial"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Perfis:</span>
            <RoleCheckboxes
              selected={form.roles}
              onChange={(roles) => setForm({ ...form, roles })}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={creating}
              style={{ marginLeft: 'auto' }}
            >
              {creating ? 'Criando...' : '+ Criar'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtro */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : users.length === 0 ? (
        <div className="page-card" style={{ textAlign: 'center', color: 'var(--text-2)', padding: '2rem' }}>
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {users.map((user) => (
            <div key={user.id} className="page-card">
              {/* Linha principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{user.name}</span>
                  <span style={{ color: 'var(--text-2)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                    {user.email}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {user.roles.map((r) => (
                    <span
                      key={r}
                      className="status-badge"
                      style={{ background: 'var(--glass-3)', color: 'var(--blue)', border: '1px solid var(--blue-border)' }}
                    >
                      {ROLE_LABEL[r]}
                    </span>
                  ))}
                </div>
                <span className={`status-badge ${user.isActive ? 'status-livre' : 'status-fechado'}`}>
                  {user.isActive ? 'Ativo' : 'Inativo'}
                </span>
                {user.mustChangePassword && (
                  <span className="status-badge status-enviado" style={{ fontSize: '0.6rem' }}>
                    Troca senha pendente
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setResetId(null);
                      editingId === user.id ? setEditingId(null) : startEdit(user);
                    }}
                  >
                    {editingId === user.id ? 'Cancelar' : 'Editar'}
                  </button>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(null);
                      setResetId(resetId === user.id ? null : user.id);
                      setNewPassword('');
                    }}
                  >
                    {resetId === user.id ? 'Cancelar' : 'Senha'}
                  </button>
                  <button
                    className={`btn-sm ${user.isActive ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.isActive ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </div>

              {/* Edição inline */}
              {editingId === user.id && (
                <div style={{
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '0.75rem',
                  marginTop: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      className="field-input"
                      placeholder="Nome"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <input
                      className="field-input"
                      type="email"
                      placeholder="E-mail"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Perfis:</span>
                    <RoleCheckboxes
                      selected={editForm.roles}
                      onChange={(roles) => setEditForm({ ...editForm, roles })}
                    />
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handleUpdate(user.id)}
                      style={{ marginLeft: 'auto' }}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              {/* Reset de senha inline */}
              {resetId === user.id && (
                <div style={{
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '0.75rem',
                  marginTop: '0.75rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-end',
                }}>
                  <input
                    className="field-input"
                    type="password"
                    placeholder="Nova senha (mín. 6 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-primary btn-sm" onClick={() => handleResetPassword(user.id)}>
                    Redefinir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
