import { Platform } from "react-native";

import  Constants from "expo-constants";

// Windows machine LAN IP (ipconfig):192.168.1.163
const LAN_IP = '192.168.1.163';
const PORT = 3000;

export const API_BASE_URL =
    Platform.OS === 'ios'
        ? `http://localhost:${PORT}`
        : Platform.OS === 'android'
        ? `http://${LAN_IP}:${PORT}`
        : `http://localhost:${PORT}`;