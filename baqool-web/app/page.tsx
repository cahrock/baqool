'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  const { user, loading } = useAuth();

  // 1. Still show a nice loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 text-gray-700 text-lg font-medium">
          Loading…
        </div>
      </main>
    );
  }

  // 2. If NOT logged in, show a friendly message + link to login
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            You’re not signed in
          </h1>
          <p className="text-slate-600 mb-6">
            Please sign in to access your Baqool dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  // 3. Logged in: show your dashboard
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6">
        <Dashboard />
      </div>
    </main>
  );
}
