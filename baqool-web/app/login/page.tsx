'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setServerError(null);
    try {
      const { data } = await api.post('/auth/login', values);
      // data.accessToken must come from your NestJS AuthService
      localStorage.setItem('accessToken', data.accessToken);
      router.replace('/');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? 'Login failed. Please try again.';
      setServerError(String(msg));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-7">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sign in to Baqool</h1>
          <p className="text-base text-gray-600 mt-2">
            Welcome back! Please enter your details.
          </p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-base font-medium text-emerald-900 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition
      ${errors.email
                  ? 'border-red-400'
                  : 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400'}
      text-emerald-900 placeholder-emerald-600 bg-white`}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-emerald-900 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition
      ${errors.password
                  ? 'border-red-400'
                  : 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400'}
      text-emerald-900 placeholder-emerald-600 bg-white`}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>


          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don’t have an account?{' '}
          <Link href="/register" className="font-medium text-slate-900 underline-offset-4 hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
