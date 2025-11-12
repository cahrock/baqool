import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { setToken, getToken, deleteToken } from '../lib/tokenStorage';

type User = {
  id: string;
  email: string;
  name?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const { data } = await api.get('/me');
      // /auth/me returns { userId, email } from your backend
      setUser({ id: data.userId ?? data.id, email: data.email ?? '' });
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
  (async () => {
    const token = await getToken();
    if (token) await refreshMe();
    setLoading(false);
  })();
  }, []);

const login = async (email: string, password: string) => {
  const { data } = await api.post('/login', { email, password });
  await setToken(data.accessToken);      
  await refreshMe();
};

const register = async (email: string, password: string, name?: string) => {
  const { data } = await api.post('/register', { email, password, name });
  await setToken(data.accessToken);      
  await refreshMe();
};

const logout = async () => {
  await deleteToken();                   
  setUser(null);
};

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
