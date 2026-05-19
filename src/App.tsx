import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleRoute } from './components/RoleRoute';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MenuPage } from './pages/admin/MenuPage';
import { TablesPage } from './pages/admin/TablesPage';
import { OrdersPage } from './pages/waiter/OrdersPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';
import { CashierPage } from './pages/cashier/CashierPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import './styles/global.css';

// Protege as rotas autenticadas e fornece o Layout com sidebar
function AuthLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <ChangePasswordModal />;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/admin/menu"
              element={<RoleRoute roles={['ADMIN']}><MenuPage /></RoleRoute>}
            />
            <Route
              path="/admin/tables"
              element={<RoleRoute roles={['ADMIN']}><TablesPage /></RoleRoute>}
            />
            <Route
              path="/waiter/orders"
              element={<RoleRoute roles={['ADMIN', 'GARCOM']}><OrdersPage /></RoleRoute>}
            />
            <Route
              path="/kitchen"
              element={<RoleRoute roles={['ADMIN', 'COZINHEIRO']}><KitchenPage /></RoleRoute>}
            />
            <Route
              path="/cashier"
              element={<RoleRoute roles={['ADMIN', 'CAIXA']}><CashierPage /></RoleRoute>}
            />
            <Route
              path="/reports"
              element={<RoleRoute roles={['ADMIN', 'CAIXA']}><ReportsPage /></RoleRoute>}
            />
            <Route
              path="/admin/users"
              element={<RoleRoute roles={['ADMIN']}><UsersPage /></RoleRoute>}
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
