export type Role = 'ADMIN' | 'GARCOM' | 'CAIXA' | 'COZINHEIRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string | null;
}
