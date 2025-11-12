// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const headerRight = () =>
    user ? (
      <Pressable
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
        style={{ paddingHorizontal: 12, paddingVertical: 6 }}
      >
        <Ionicons name="log-out-outline" size={22} />
      </Pressable>
    ) : null;

  return (
    <Tabs screenOptions={{ headerRight }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      {/* Add more tabs here */}
    </Tabs>
  );
}
