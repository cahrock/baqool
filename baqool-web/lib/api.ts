// baqool-web/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // NestJS backend
  timeout: 10000,
});

// Attach accessToken from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
