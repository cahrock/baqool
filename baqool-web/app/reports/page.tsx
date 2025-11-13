'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 text-gray-700 text-lg font-medium">Loading…</div>
      </main>
    );
  }

  if (!user) return null;

  // The protected content here
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Reports
        </h1>
        <p className="text-slate-700">
          Only logged-in users can see this page. Hello,{' '}
          <span className="font-semibold">
            {user.name || user.email}
          </span>
          !
        </p>
      </div>
    </main>
  );
}
