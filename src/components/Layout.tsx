import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Grid3X3,
  ClipboardList,
  ChefHat,
  Receipt,
  BarChart2,
  Users,
  LogOut,
  Menu,
  X,
  User,
  Flame,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types/auth';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Painel',      roles: ['ADMIN'] },
  { to: '/admin/menu',    icon: BookOpen,         label: 'Cardápio',    roles: ['ADMIN'] },
  { to: '/admin/tables',  icon: Grid3X3,          label: 'Mesas',       roles: ['ADMIN'] },
  { to: '/waiter/orders', icon: ClipboardList,    label: 'Pedidos',     roles: ['ADMIN', 'GARCOM'] },
  { to: '/kitchen',       icon: ChefHat,          label: 'Cozinha',     roles: ['ADMIN', 'COZINHEIRO'] },
  { to: '/cashier',       icon: Receipt,          label: 'Caixa',       roles: ['ADMIN', 'CAIXA'] },
  { to: '/reports',       icon: BarChart2,        label: 'Relatórios',  roles: ['ADMIN', 'CAIXA'] },
  { to: '/admin/users',   icon: Users,            label: 'Usuários',    roles: ['ADMIN'] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:      'Admin',
  GARCOM:     'Garçom',
  COZINHEIRO: 'Cozinheiro',
  CAIXA:      'Caixa',
};

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const items = NAV_ITEMS.filter(
    (item) => user && user.roles.some((r) => item.roles.includes(r)),
  );

  const roleLabel = user?.roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ');

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <Flame size={22} className="brand-flame" strokeWidth={2} />
          <div className="brand-text">
            <span className="brand-name">Espetinho</span>
            <span className="brand-sub">do Bastuca</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              <Icon size={17} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">
              <User size={14} strokeWidth={1.8} />
            </div>
            <div className="user-meta">
              <span className="user-display-name">
                {user?.name || user?.email?.split('@')[0]}
              </span>
              <span className="user-display-role">{roleLabel}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sair">
            <LogOut size={15} strokeWidth={1.9} />
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-brand">
            <Flame size={17} className="brand-flame" strokeWidth={2} />
            <span>Espetinho do Bastuca</span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
