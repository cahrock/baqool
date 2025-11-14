'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
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
          Loading your dashboard…
        </div>
      </main>
    );
  }

  // While redirecting, render nothing
  if (!user) return null;

  const displayName = user.name || user.email;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Baqool Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold">{displayName}</span>.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 active:bg-slate-900"
          >
            Logout
          </button>
        </header>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)]">
          {/* Left: main welcome card */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-900">
                  Welcome <span role="img" aria-label="wave">👋</span>
                </h2>
                <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed">
                  You’re signed in as{' '}
                  <span className="font-semibold text-emerald-700">
                    {displayName}
                  </span>.  
                  Baqool is ready to help you explore ideas, draft content, and
                  build AI-powered conversations.
                </p>
              </div>
            </div>

            {/* Quick stats / info strip */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  Online
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Backend & auth connected.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Conversations
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Coming soon
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  You’ll see your recent chats here.
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
                  Multi-model support planned.
                </p>
              </div>
            </div>

            {/* Primary action */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-600"
              >
                Start a new chat
              </button>
              <p className="text-xs md:text-sm text-slate-500">
                Week 3 will turn this into a real conversation view with
                stored messages and AI replies.
              </p>
            </div>
          </section>

          {/* Right side: secondary cards */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Next steps (roadmap)
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• Add conversation & message tables (Prisma).</li>
                <li>• Build “New Chat” and Conversation List views.</li>
                <li>• Wire in AI responses using your chosen models.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Tip
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                This dashboard is only visible after login. If you refresh and
                still see it, your JWT & auth guard are working correctly.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
