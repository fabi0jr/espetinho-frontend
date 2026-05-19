import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { menuApi } from '../../services/menu.api';
import type { MenuItem } from '../../types/models';

export function MenuPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const { data } = await menuApi.list();
      setItems(data);
    } catch {
      setError('Erro ao carregar cardápio');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await menuApi.create({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        category: form.category,
      });
      setItems((prev) => [data, ...prev]);
      setForm({ name: '', description: '', price: '', category: '' });
    } catch {
      setError('Erro ao criar item');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAvailable(item: MenuItem) {
    try {
      const { data } = await menuApi.update(item.id, { isAvailable: !item.isAvailable });
      setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
    } catch {
      setError('Erro ao atualizar item');
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover este item?')) return;
    try {
      await menuApi.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('Erro ao remover. Se houver pedidos vinculados, desative-o.');
    }
  }

  async function handleImageUpload(file: File) {
    if (!uploadTargetId) return;
    setUploadingId(uploadTargetId);
    try {
      const { data } = await menuApi.getUploadUrl(uploadTargetId);
      await menuApi.uploadImage(data.url, file);
      const { data: updated } = await menuApi.update(uploadTargetId, { imageUrl: data.imageUrl });
      setItems((prev) => prev.map((i) => (i.id === uploadTargetId ? updated : i)));
    } catch {
      setError('Erro ao fazer upload da imagem');
    } finally {
      setUploadingId(null);
      setUploadTargetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const categories = [...new Set(items.map((i) => i.category))].sort();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>🍢</Link>
          <h2>Cardápio</h2>
        </div>
        <div className="header-user">
          <span className="user-role-badge">{user?.role}</span>
          <button className="logout-button" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}

        <div className="page-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Adicionar item</h3>
          <form onSubmit={handleCreate} className="inline-form">
            <input className="field-input" placeholder="Nome" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="field-input" placeholder="Categoria" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <input className="field-input" type="number" step="0.01" min="0.01"
              placeholder="Preço (R$)" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="field-input" placeholder="Descrição (opcional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        ) : (
          categories.map((cat) => (
            <div key={cat} style={{ marginBottom: '1.5rem' }}>
              <h4 className="category-label">{cat}</h4>
              <div className="item-list">
                {items.filter((i) => i.category === cat).map((item) => (
                  <div key={item.id} className={`item-card ${!item.isAvailable ? 'item-disabled' : ''}`}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="item-image" />}
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">R$ {Number(item.price).toFixed(2)}</span>
                      {item.description && <span className="item-desc">{item.description}</span>}
                    </div>
                    <div className="item-actions">
                      <button className="btn-ghost" disabled={uploadingId === item.id}
                        onClick={() => { setUploadTargetId(item.id); fileInputRef.current?.click(); }}>
                        {uploadingId === item.id ? '...' : '📷'}
                      </button>
                      <button className={`btn-ghost ${item.isAvailable ? '' : 'btn-active'}`}
                        onClick={() => handleToggleAvailable(item)}>
                        {item.isAvailable ? 'Desativar' : 'Ativar'}
                      </button>
                      <button className="btn-danger" onClick={() => handleRemove(item.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
