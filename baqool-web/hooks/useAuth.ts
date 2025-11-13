import { useState, useEffect } from 'react';
import api from '../lib/api';

//
// 1) Define the User type
//
export type User = {
  id: string;
  email: string;
  name?: string | null;
};

//
// 2) Hook return type
//
type AuthContext = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

//
// 3) useAuth hook
//
export function useAuth(): AuthContext {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) fetchProfile(token);
    else setLoading(false);
  }, []);

  //
  // Load /auth/me
  //
  async function fetchProfile(token: string) {
    try {
      const res = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser({
        id: res.data.userId ?? res.data.id,
        email: res.data.email,
        name: res.data.name ?? null,
      });
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  
  //
  // Login
  //
  async function login(email: string, password: string) {
    const { data } = await api.post('/login', { email, password });

    localStorage.setItem('accessToken', data.accessToken);
    await fetchProfile(data.accessToken);
  }

  //
  // Register
  //
  async function register(email: string, password: string, name?: string) {
    const { data } = await api.post('/register', { email, password, name });

    localStorage.setItem('accessToken', data.accessToken);
    await fetchProfile(data.accessToken);
  }

  //
  // Logout
  //
  function logout() {
    localStorage.removeItem('accessToken');
    setUser(null);
  }

  return { user, loading, login, register, logout };
}
