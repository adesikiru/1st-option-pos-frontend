'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken, getStoredUser } from '@/lib/api';
import { DashboardMetrics, Product, Sale } from '@/lib/types';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign,
  BarChart3, ArrowRight, Zap, Clock, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshed, setRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDashboard();
      setMetrics(data);
      setRefreshed(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const paymentLabels: Record<string, string> = {
    CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', POS_CARD: 'POS/Card', SPLIT: 'Split'
  };

  const user = getStoredUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-emerald-600">{user?.name?.split(' ')[0] ?? 'Staff'}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshed && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Updated {refreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/pos"
            id="go-to-pos-btn"
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20 transition-all"
          >
            <Zap className="w-4 h-4" /> Open POS Terminal
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
      )}

      {metrics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Today's Sales</p>
                  <p className="text-2xl font-bold text-slate-900">{fmt(metrics.todaySales ?? 0)}</p>
                  <p className="text-xs text-slate-400 mt-1">{metrics.todayTransactions ?? 0} transactions</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Transactions Today</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.todayTransactions ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Completed sales</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Products In Stock</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.totalInStock ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Active products</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow ${
              (metrics.lowStockCount ?? 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">Low Stock Alerts</p>
                  <p className={`text-2xl font-bold ${(metrics.lowStockCount ?? 0) > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                    {metrics.lowStockCount ?? 0}
                  </p>
                  <Link href="/inventory" className="text-xs text-amber-600 hover:underline mt-1 inline-block">
                    {(metrics.lowStockCount ?? 0) > 0 ? 'Review now →' : 'All products OK'}
                  </Link>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Inventory Valuation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Inventory Valuation
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Stock Items</span>
                  <span className="font-semibold text-slate-900">{metrics.inventoryValuation?.totalItems?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Cost Value</span>
                  <span className="font-semibold text-slate-900">{fmt(metrics.inventoryValuation?.totalStockCost ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-700">Retail Value</span>
                  <span className="font-bold text-emerald-700">{fmt(metrics.inventoryValuation?.totalStockRetailValue ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Payment Methods (Today)
              </h2>
              {metrics.salesByPaymentMethod && Object.keys(metrics.salesByPaymentMethod).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => (
                    <div key={method} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28 shrink-0">{paymentLabels[method] ?? method}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          style={{ width: `${Math.min(((amount as number) / (metrics.todaySales || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-24 text-right">{fmt(amount as number)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-2">No sales recorded today yet.</p>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" /> Top Selling Products
              </h2>
              {metrics.topProducts?.length > 0 ? (
                <div className="space-y-2">
                  {metrics.topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700">{fmt(p.revenue)}</p>
                        <p className="text-xs text-slate-400">{p.quantitySold} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No sales data yet.</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
              <Link href="/sales" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 text-left font-semibold">Receipt No.</th>
                    <th className="px-5 py-3 text-left font-semibold">Cashier</th>
                    <th className="px-5 py-3 text-left font-semibold">Payment</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.recentSales?.length > 0 ? metrics.recentSales.map((sale: Sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-emerald-700 font-semibold text-xs">{sale.receiptNumber}</td>
                      <td className="px-5 py-3 text-slate-700">{sale.cashier?.name ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(Number(sale.totalAmount))}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          sale.status === 'VOIDED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>{sale.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {new Date(sale.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                        No recent transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
