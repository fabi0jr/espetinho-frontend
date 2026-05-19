import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { RoleRoute } from './components/RoleRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MenuPage } from './pages/admin/MenuPage';
import { TablesPage } from './pages/admin/TablesPage';
import { OrdersPage } from './pages/waiter/OrdersPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';
import { CashierPage } from './pages/cashier/CashierPage';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute><DashboardPage /></PrivateRoute>}
          />
          <Route
            path="/admin/menu"
            element={<PrivateRoute><RoleRoute roles={['ADMIN']}><MenuPage /></RoleRoute></PrivateRoute>}
          />
          <Route
            path="/admin/tables"
            element={<PrivateRoute><RoleRoute roles={['ADMIN']}><TablesPage /></RoleRoute></PrivateRoute>}
          />
          <Route
            path="/waiter/orders"
            element={<PrivateRoute><RoleRoute roles={['ADMIN', 'GARCOM']}><OrdersPage /></RoleRoute></PrivateRoute>}
          />
          <Route
            path="/kitchen"
            element={<PrivateRoute><RoleRoute roles={['ADMIN', 'COZINHEIRO']}><KitchenPage /></RoleRoute></PrivateRoute>}
          />
          <Route
            path="/cashier"
            element={<PrivateRoute><RoleRoute roles={['ADMIN', 'CAIXA']}><CashierPage /></RoleRoute></PrivateRoute>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
