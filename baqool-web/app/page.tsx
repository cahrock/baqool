'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AppShell from '@/components/AppShell';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white/80 px-6 py-4 text-slate-700 shadow-sm border border-slate-200">
          Loading…
        </div>
      </main>
    );
  }

  if (!user) return null; // while redirecting

  const displayName = user.name || user.email;

  return (
    <AppShell
      title="Welcome"
      subtitle="Your Baqool AI workspace is ready."
    >
      {/* This is the inner dashboard content only */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
        <h2 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-900">
          Hello, {displayName}{' '}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h2>
        <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed">
          This is your central hub. Soon you’ll see your recent conversations,
          models, and analytics here as we build out Week&nbsp;3 and beyond.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Authenticated
            </p>
            <p className="mt-1 text-xs text-slate-500">
              You’ve successfully logged in via NestJS + JWT.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Conversations
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Coming in Week 3
            </p>
            <p className="mt-1 text-xs text-slate-500">
              We’ll list your chats and message history here.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Models
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              GPT-5 / GPT-4o / more
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The multi-model selector will live in this panel.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-600"
          >
            Start a new chat
          </button>
          <p className="text-xs md:text-sm text-slate-500">
            This button will open the new-conversation view once we implement
            Week&nbsp;3 conversation storage.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
