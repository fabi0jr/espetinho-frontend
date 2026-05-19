import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials } from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tryRefresh = useCallback(async () => {
    try {
      const { data } = await authApi.refresh();
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        const { data: me } = await authApi.me();
        setUser({
          id: me.id,
          name: me.name,
          email: me.email,
          roles: me.roles as User['roles'],
          mustChangePassword: me.mustChangePassword,
        });
      }
    } catch {
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    tryRefresh();
  }, [tryRefresh]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('access_token', data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
