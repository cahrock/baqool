import { useState, useEffect } from 'react';
import api from '../lib/api';


export function useAuth() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) fetchProfile(token);
    }, []);

    async function fetchProfile(token: string) {
        try {
        const res = await api.get('/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
        } catch { localStorage.removeItem('accessToken'); }
    }

    async function login(email: string, password: string) {
        const { data } = await api.post('/login', { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        await fetchProfile(data.accessToken);
    }

    async function register(email: string, password: string, name?: string) {
        const { data } = await api.post('/register', { email, password, name });
        localStorage.setItem('accessToken', data.accessToken);
        await fetchProfile(data.accessToken);   
    }

    async function logout() {
        localStorage.removeItem('accessToken');
        setUser(null);
    }
    return { user, login, register, logout };
}