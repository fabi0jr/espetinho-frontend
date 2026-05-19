import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

interface RoleRouteProps {
  children: ReactNode;
  roles: Role[];
}

export function RoleRoute({ children, roles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !user.roles.some((r) => roles.includes(r))) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
