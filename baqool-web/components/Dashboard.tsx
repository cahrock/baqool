'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  // If for some reason this renders without a user,
  // just render nothing. app/page.tsx will handle redirecting.
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();            // clears token + user in context
    router.replace('/login');  // go back to login screen
  };

  return (
    <div className="mt-20 flex justify-center">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-10 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Welcome <span role="img" aria-label="wave">👋</span>
            </h1>
            <p className="mt-2 text-base text-slate-700">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm
                       hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-offset-2 focus-visible:ring-slate-900"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Your dashboard</h2>
          <p className="mt-2 text-sm text-slate-700">
            This is your protected dashboard. You can now add widgets, stats, and links here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
