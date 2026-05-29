import { useState, useEffect } from 'react';
import { menuApi } from '../../services/menu.api';
import type { MenuItem } from '../../types/models';

export function CardapioPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    menuApi
      .listPublic()
      .then(({ data }) => setItems(data))
      .catch(() => setError('Não foi possível carregar o cardápio.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(items.map((i) => i.category))].sort();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>ESPETINHO DO BASTUCA</h1>
        <p style={styles.subtitle}>CARDÁPIO</p>
        <div style={styles.divider} />
      </header>

      {loading && <p style={styles.info}>Carregando...</p>}
      {error && <p style={styles.info}>{error}</p>}

      {!loading && !error && categories.length === 0 && (
        <p style={styles.info}>Cardápio indisponível no momento.</p>
      )}

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return (
          <section key={cat} style={styles.section}>
            <h2 style={styles.categoryTitle}>{cat.toUpperCase()}</h2>
            <div style={styles.categoryDivider} />
            {catItems.map((item) => (
              <div key={item.id} style={styles.item}>
                <div style={styles.itemLeft}>
                  <span style={styles.itemName}>{item.name}</span>
                  {item.description && (
                    <span style={styles.itemDesc}>{item.description}</span>
                  )}
                </div>
                <div style={styles.dots} />
                <span style={styles.itemPrice}>
                  R$ {Number(item.price).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </section>
        );
      })}

      <footer style={styles.footer}>
        <div style={styles.footerDivider} />
        <p style={styles.footerText}>Preços sujeitos a alteração sem aviso prévio.</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0f0e0c',
    padding: '32px 20px',
    maxWidth: '480px',
    margin: '0 auto',
    boxSizing: 'border-box',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    color: '#d4a847',
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    margin: 0,
  },
  subtitle: {
    color: '#7a6a50',
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    margin: '6px 0 12px',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #d4a847, transparent)',
    width: '70%',
    margin: '0 auto',
  },
  section: {
    marginBottom: '28px',
  },
  categoryTitle: {
    color: '#d4a847',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    margin: '0 0 6px',
  },
  categoryDivider: {
    height: '1px',
    background: '#2a2416',
    marginBottom: '12px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '6px',
    marginBottom: '12px',
  },
  itemLeft: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  itemName: {
    color: '#e8e0d0',
    fontSize: '0.9rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  itemDesc: {
    color: '#7a6a50',
    fontSize: '0.72rem',
    marginTop: '2px',
  },
  dots: {
    flex: 1,
    borderBottom: '1px dotted #3a3020',
    marginBottom: '4px',
    minWidth: '12px',
  },
  itemPrice: {
    color: '#d4a847',
    fontSize: '0.9rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  info: {
    color: '#7a6a50',
    textAlign: 'center',
    marginTop: '40px',
    fontFamily: 'Georgia, serif',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
  },
  footerDivider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #2a2416, transparent)',
    marginBottom: '12px',
  },
  footerText: {
    color: '#4a3a28',
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
  },
};
