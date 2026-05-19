import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <span>🍢</span>
          <h2>Espetinho do Bastuca</h2>
        </div>
        <div className="header-user">
          <span className="user-role-badge">{user?.role}</span>
          <span className="user-name">{user?.name || user?.email}</span>
          <button className="logout-button" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h1>Bem-vindo ao sistema!</h1>
          <p>As próximas funcionalidades serão adicionadas nas fases seguintes.</p>
        </div>
      </main>
    </div>
  );
}
