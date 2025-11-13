// app/protected/page.tsx
'use client';

import { Protected } from '@/components/Protected';

export default function ReportsPage() {
  return (
    <Protected>
      {/* protected content here */}
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl p-6">
          <h1 className="text-2xl font-bold text-slate-900">Protected</h1>
        </div>
      </div>
    </Protected>
  );
}
