'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type AppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/conversations', label: 'Conversations' }, // future page
  { href: '/settings', label: 'Settings' },           // future page
];

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const displayName = user?.name || user?.email || 'Guest';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Optional: show a simple loading shell while auth is resolving
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white/80 px-6 py-4 text-slate-700 shadow-sm border border-slate-200">
          Loading your workspace…
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
        <div className="px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="text-lg font-semibold tracking-tight">
            Baqool<span className="text-emerald-400">AI</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Multi-model chat workspace
          </p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 text-sm">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center rounded-lg px-3 py-2 transition',
                  active
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-4 py-4 text-xs text-slate-300">
          <div className="mb-1 font-semibold">{displayName}</div>
          <button
            onClick={handleLogout}
            className="mt-1 inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-xs font-medium hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {title || 'Dashboard'}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Compact user + logout on small screens */}
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="hidden sm:inline text-slate-500">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 active:bg-slate-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
