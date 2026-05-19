import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Camera, Eye, EyeOff, Trash2, ImageOff, BookOpen, ChevronDown } from 'lucide-react';
import { menuApi } from '../../services/menu.api';
import type { MenuItem } from '../../types/models';

/* ── Combobox de categoria ─────────────────────────── */
function CategoryCombobox({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="combobox" ref={ref}>
      <div className="combobox-input-wrap">
        <input
          className="field-input combobox-input"
          placeholder="Ex: Espetinhos"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          required
          autoComplete="off"
        />
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`combobox-chevron ${open ? 'combobox-chevron--open' : ''}`}
          onClick={() => setOpen((o) => !o)}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="combobox-dropdown">
          {filtered.map((s) => (
            <li
              key={s}
              className={`combobox-option ${s === value ? 'combobox-option--active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MenuPage() {
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
    <div className="page-wrapper">
      <h1 className="page-title">Cardápio</h1>

      {error && <p className="error-message">{error}</p>}

      {/* ── Formulário de novo item ── */}
      <div className="page-card">
        <h3 className="card-section-title">Adicionar item</h3>
        <form onSubmit={handleCreate} className="menu-form">
          <div className="menu-form-row">
            <div className="form-field">
              <label className="field-label">Nome</label>
              <input
                className="field-input"
                placeholder="Ex: Espetinho de frango"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-field form-field--sm">
              <label className="field-label">Categoria</label>
              <CategoryCombobox
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                suggestions={categories}
              />
            </div>
            <div className="form-field form-field--xs">
              <label className="field-label">Preço (R$)</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="menu-form-row">
            <div className="form-field">
              <label className="field-label">Descrição <span className="field-optional">(opcional)</span></label>
              <input
                className="field-input"
                placeholder="Breve descrição do item"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary menu-form-submit">
              {submitting ? 'Salvando...' : '+ Adicionar'}
            </button>
          </div>
        </form>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }}
      />

      {/* ── Lista de itens ── */}
      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Carregando...</p>
      ) : categories.length === 0 ? (
        <div className="menu-empty">
          <div className="menu-empty-icon">
            <BookOpen size={36} strokeWidth={1.3} />
          </div>
          <h2>Cardápio vazio</h2>
          <p>Adicione o primeiro item usando o formulário acima.</p>
        </div>
      ) : (
        categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          return (
            <div key={cat} className="menu-category-section">
              <div className="menu-category-header">
                <span className="menu-category-name">{cat}</span>
                <span className="menu-category-count">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="item-list">
                {catItems.map((item) => (
                  <div key={item.id} className={`item-card ${!item.isAvailable ? 'item-disabled' : ''}`}>

                    {/* Imagem ou placeholder */}
                    <div className="item-image-wrap">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="item-image" />
                      ) : (
                        <div className="item-image-placeholder">
                          <ImageOff size={16} strokeWidth={1.5} />
                        </div>
                      )}
                      {!item.isAvailable && (
                        <span className="item-unavailable-badge">Indisponível</span>
                      )}
                    </div>

                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">R$ {Number(item.price).toFixed(2)}</span>
                      {item.description && (
                        <span className="item-desc">{item.description}</span>
                      )}
                    </div>

                    <div className="item-actions">
                      <button
                        className="btn-ghost btn-sm btn-icon"
                        disabled={uploadingId === item.id}
                        title="Trocar foto"
                        onClick={() => { setUploadTargetId(item.id); fileInputRef.current?.click(); }}
                      >
                        {uploadingId === item.id
                          ? <span style={{ fontSize: '0.7rem' }}>...</span>
                          : <Camera size={14} strokeWidth={1.8} />}
                      </button>
                      <button
                        className={`btn-ghost btn-sm btn-icon ${!item.isAvailable ? 'btn-active' : ''}`}
                        title={item.isAvailable ? 'Desativar item' : 'Ativar item'}
                        onClick={() => handleToggleAvailable(item)}
                      >
                        {item.isAvailable
                          ? <Eye size={14} strokeWidth={1.8} />
                          : <EyeOff size={14} strokeWidth={1.8} />}
                      </button>
                      <button
                        className="btn-danger btn-sm btn-icon"
                        title="Remover item"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
