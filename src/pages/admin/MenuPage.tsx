import { useState, useEffect, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Camera, Eye, EyeOff, Trash2, ImageOff, BookOpen, ChevronDown, QrCode, X, Download, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { menuApi } from '../../services/menu.api';
import type { MenuItem } from '../../types/models';

const CARDAPIO_URL = `${window.location.origin}/cardapio`;

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

/* ── Modal do QR Code ──────────────────────────────── */
function QrModal({ onClose }: { onClose: () => void }) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = 'qrcode-cardapio.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = url;
  }, []);

  const handlePrint = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const clonedSvg = svg.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('width', '200');
    clonedSvg.setAttribute('height', '200');

    const win = window.open('', '_blank');
    if (!win) return;

    const style = win.document.createElement('style');
    style.textContent =
      'body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Georgia,serif;} p{font-size:12px;color:#555;margin-top:12px;}';

    const p = win.document.createElement('p');
    p.textContent = 'Escaneie para acessar o cardápio';

    win.document.head.appendChild(style);
    win.document.body.appendChild(clonedSvg);
    win.document.body.appendChild(p);

    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '320px' }}>
        <div className="modal-header">
          <h2 className="modal-title">QR Code do Cardápio</h2>
          <button className="btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--text-2)', fontSize: '0.8rem', marginBottom: '16px', textAlign: 'center' }}>
          Imprima e coloque nas mesas para os clientes acessarem o cardápio.
        </p>

        <div ref={qrRef} style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
          <QRCode value={CARDAPIO_URL} size={180} />
        </div>

        <p style={{ color: 'var(--text-2)', fontSize: '0.72rem', textAlign: 'center', marginBottom: '16px', wordBreak: 'break-all' }}>
          {CARDAPIO_URL}
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleDownload}>
            <Download size={14} strokeWidth={2} style={{ marginRight: '6px' }} />
            Baixar PNG
          </button>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={handlePrint}>
            <Printer size={14} strokeWidth={2} style={{ marginRight: '6px' }} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MenuPage principal ────────────────────────────── */
export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Cardápio</h1>
        <button className="btn-ghost btn-sm" onClick={() => setShowQr(true)} title="Gerar QR Code do cardápio">
          <QrCode size={16} strokeWidth={1.8} style={{ marginRight: '6px' }} />
          QR Code
        </button>
      </div>

      {showQr && <QrModal onClose={() => setShowQr(false)} />}

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
