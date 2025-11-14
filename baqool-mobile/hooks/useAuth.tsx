// hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// Token storage helper: SecureStore (native) + localStorage (web)
// ─────────────────────────────────────────────
const TOKEN_KEY = 'accessToken';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const { data } = await api.get('/me');
      // backend returns { id, email, name }
      setUser({ id: data.id, email: data.email, name: data.name ?? undefined });
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      if (token) {
        await refreshMe();
      }
      setLoading(false);
    };
    init();
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
    await removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
