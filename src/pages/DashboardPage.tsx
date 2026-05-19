import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'GARCOM') navigate('/waiter/orders', { replace: true });
    else if (user.role === 'COZINHEIRO') navigate('/kitchen', { replace: true });
    else if (user.role === 'CAIXA') navigate('/cashier', { replace: true });
  }, [user, navigate]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand"><span>🍢</span><h2>Espetinho do Bastuca</h2></div>
        <div className="header-user">
          <span className="user-role-badge">{user.role}</span>
          <span className="user-name">{user.name || user.email}</span>
          <button className="logout-button" onClick={logout}>Sair</button>
        </div>
      </header>
      <main className="dashboard-main">
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Painel Administrativo</h1>
        <div className="nav-grid">
          <Link to="/admin/menu" className="nav-card">
            <span className="nav-icon">🍽️</span>
            <h3>Cardápio</h3>
            <p>Gerenciar itens, preços e fotos</p>
          </Link>
          <Link to="/admin/tables" className="nav-card">
            <span className="nav-icon">🪑</span>
            <h3>Mesas</h3>
            <p>Cadastrar e remover mesas</p>
          </Link>
          <Link to="/waiter/orders" className="nav-card">
            <span className="nav-icon">📋</span>
            <h3>Pedidos</h3>
            <p>Acompanhar todos os pedidos</p>
          </Link>
          <Link to="/kitchen" className="nav-card">
            <span className="nav-icon">🔥</span>
            <h3>Cozinha</h3>
            <p>Fila de preparo</p>
          </Link>
          <Link to="/cashier" className="nav-card">
            <span className="nav-icon">💰</span>
            <h3>Caixa</h3>
            <p>Fechar pedidos prontos</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
