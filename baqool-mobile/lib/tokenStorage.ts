// lib/tokenStorage.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'accessToken';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }
  // Native (iOS/Android)
  try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    return;
  }
  try { await SecureStore.setItemAsync(TOKEN_KEY, token); } catch {}
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    return;
  }
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
}
