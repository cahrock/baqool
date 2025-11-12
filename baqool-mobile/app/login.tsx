import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator,} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, register: registerUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const {
    // remove "register" here since it's unused
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: FormData) => {
    try {
      if (mode === 'login') {
        await login(values.email.trim(), values.password);
      } else {
        await registerUser(values.email.trim(), values.password, values.name?.trim());
      }
      router.replace('/'); // go to home
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Request failed';
      Alert.alert(mode === 'login' ? 'Login failed' : 'Register failed', String(msg));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Baqool {mode === 'login' ? 'Login' : 'Register'}</Text>

      {mode === 'register' && (
        <>
          <TextInput
            placeholder="Name (optional)"
            style={[styles.input, errors.name && styles.inputError]}
            onChangeText={(t) => setValue('name', t, { shouldValidate: true })}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}
        </>
      )}

      <TextInput
        placeholder="Email"
        style={[styles.input, errors.email && styles.inputError]}
        onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <TextInput
        placeholder="Password"
        style={[styles.input, errors.password && styles.inputError]}
        onChangeText={(t) => setValue('password', t, { shouldValidate: true })}
        secureTextEntry
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      <View style={{ height: 8 }} />

      {isSubmitting ? (
        <ActivityIndicator />
      ) : (
        <Button
          title={mode === 'login' ? 'Login' : 'Create Account'}
          onPress={handleSubmit(onSubmit)}
        />
      )}

      <View style={{ height: 12 }} />
      <Button
        title={mode === 'login' ? "Don't have an account? Register" : 'Have an account? Login'}
        onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 10, marginBottom: 8 },
  inputError: { borderColor: '#d33' },
  error: { color: '#d33', marginBottom: 8 },
});
