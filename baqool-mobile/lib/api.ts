import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from './tokenStorage';   // new

const LAN_IP = '192.168.1.23';
const PORT = 3000;

const API_BASE_URL =
  Platform.OS === 'ios'
    ? `http://localhost:${PORT}` // iOS simulator only
    : Platform.OS === 'android'
      ? `http://${LAN_IP}:${PORT}` // Android emulator or physical device
      : `http://localhost:${PORT}`; // web

export const api = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});
