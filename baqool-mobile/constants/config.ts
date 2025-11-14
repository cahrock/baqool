import { Platform } from "react-native";

import  Constants from "expo-constants";

// Windows machine LAN IP (ipconfig):192.168.1.163
const LAN_IP = '192.168.1.163';
const PORT = 4000;

export const API_BASE_URL =
  Platform.OS === 'ios'
    ? `http://localhost:${PORT}` // iOS simulator only
    : Platform.OS === 'android'
      ? `http://${LAN_IP}:${PORT}` // Android emulator or physical device
      : `http://localhost:${PORT}`; // web


