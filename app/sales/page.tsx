'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/api';
import SalesHistory from '@/components/SalesHistory';
import { Receipt } from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getStoredToken()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" /> Sales & Receipt History
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit transactions and reprint customer thermal receipts (58mm / 80mm)
          </p>
        </div>
      </div>

      <SalesHistory />
    </div>
  );
}
