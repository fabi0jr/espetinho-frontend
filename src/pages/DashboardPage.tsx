import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Grid3X3, ClipboardList, ChefHat, Receipt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'GARCOM')     navigate('/waiter/orders', { replace: true });
    else if (user.role === 'COZINHEIRO') navigate('/kitchen', { replace: true });
    else if (user.role === 'CAIXA') navigate('/cashier', { replace: true });
  }, [user, navigate]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Painel Administrativo</h1>
      <div className="nav-grid">
        <Link to="/admin/menu" className="nav-card">
          <BookOpen size={28} strokeWidth={1.5} className="nav-card-icon" />
          <h3>Cardápio</h3>
          <p>Gerenciar itens, preços e fotos</p>
        </Link>
        <Link to="/admin/tables" className="nav-card">
          <Grid3X3 size={28} strokeWidth={1.5} className="nav-card-icon" />
          <h3>Mesas</h3>
          <p>Cadastrar e remover mesas</p>
        </Link>
        <Link to="/waiter/orders" className="nav-card">
          <ClipboardList size={28} strokeWidth={1.5} className="nav-card-icon" />
          <h3>Pedidos</h3>
          <p>Acompanhar todos os pedidos</p>
        </Link>
        <Link to="/kitchen" className="nav-card">
          <ChefHat size={28} strokeWidth={1.5} className="nav-card-icon" />
          <h3>Cozinha</h3>
          <p>Fila de preparo</p>
        </Link>
        <Link to="/cashier" className="nav-card">
          <Receipt size={28} strokeWidth={1.5} className="nav-card-icon" />
          <h3>Caixa</h3>
          <p>Fechar pedidos prontos</p>
        </Link>
      </div>
    </div>
  );
}
