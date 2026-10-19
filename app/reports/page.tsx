'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar, RefreshCw } from 'lucide-react';

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

export default function ReportsPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const [sr, ir] = await Promise.all([
        api.getSalesReport(dateFrom, dateTo),
        api.getInventoryReport(),
      ]);
      setSalesReport(sr);
      setInventoryReport(ir);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  const pmLabels: Record<string, string> = {
    CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', POS_CARD: 'POS/Card', SPLIT: 'Split',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-rose-600" /> Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Business performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border-0 focus:outline-none bg-transparent text-slate-700" />
            <span className="text-slate-400">–</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border-0 focus:outline-none bg-transparent text-slate-700" />
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !salesReport ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales Summary KPIs */}
          {salesReport && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{fmt(salesReport.totalRevenue ?? 0)}</p>
                  <p className="text-xs text-slate-400 mt-1">{dateFrom} – {dateTo}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-slate-900">{salesReport.totalTransactions ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Completed sales</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Avg. Sale Value</p>
                  <p className="text-2xl font-bold text-slate-900">{fmt(salesReport.averageSaleValue ?? 0)}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Discounts</p>
                  <p className="text-2xl font-bold text-rose-600">-{fmt(salesReport.totalDiscounts ?? 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Sales by Payment Method */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Sales by Payment Method
                  </h2>
                  {salesReport.byPaymentMethod && Object.keys(salesReport.byPaymentMethod).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(salesReport.byPaymentMethod).map(([method, data]: [string, any]) => (
                        <div key={method} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 w-28 shrink-0">{pmLabels[method] ?? method}</span>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              style={{ width: `${Math.min(((data.amount ?? 0) / (salesReport.totalRevenue || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-xs font-semibold text-slate-700">{fmt(data.amount ?? 0)}</div>
                            <div className="text-xs text-slate-400">{data.count} sales</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">No data for selected period.</p>}
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-500" /> Top Selling Products
                  </h2>
                  {salesReport.topProducts?.length > 0 ? (
                    <div className="space-y-2">
                      {salesReport.topProducts.slice(0, 8).map((p: any, i: number) => (
                        <div key={p.productId ?? i} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                          <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
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
                  ) : <p className="text-sm text-slate-400">No product sales data yet.</p>}
                </div>
              </div>

              {/* Daily Sales Breakdown */}
              {salesReport.dailySales?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">Daily Sales Breakdown</h2>
                  </div>
                  <div className="overflow-x-auto thin-scroll">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                          <th className="px-5 py-3 text-left font-semibold">Date</th>
                          <th className="px-5 py-3 text-right font-semibold">Transactions</th>
                          <th className="px-5 py-3 text-right font-semibold">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {salesReport.dailySales.map((d: any) => (
                          <tr key={d.date} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 text-slate-700">{new Date(d.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{d.count}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(d.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Inventory Report */}
          {inventoryReport && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-500" />
                <h2 className="font-semibold text-slate-800">Inventory Report (Current)</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border-b border-slate-100">
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Products</p>
                  <p className="text-2xl font-bold text-slate-900">{inventoryReport.summary?.activeProducts ?? 0}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Low Stock Items</p>
                  <p className="text-2xl font-bold text-amber-700">{inventoryReport.summary?.lowStockCount ?? 0}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Retail Inventory Value</p>
                  <p className="text-2xl font-bold text-emerald-700">{fmt(inventoryReport.summary?.totalRetailValue ?? 0)}</p>
                </div>
              </div>
              {inventoryReport.products?.length > 0 && (
                <div className="overflow-x-auto thin-scroll">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                        <th className="px-5 py-3 text-left font-semibold">Product</th>
                        <th className="px-5 py-3 text-right font-semibold">Stock Qty</th>
                        <th className="px-5 py-3 text-right font-semibold">Selling Price</th>
                        <th className="px-5 py-3 text-right font-semibold">Retail Value</th>
                        <th className="px-5 py-3 text-left font-semibold">Stock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventoryReport.products.slice(0, 30).map((p: any) => {
                        const isLow = Number(p.stockQuantity) <= Number(p.minStockThreshold);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-medium text-slate-800">{p.name}</div>
                              <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>{Number(p.stockQuantity)}</span>
                              <span className="text-xs text-slate-400 ml-1">{p.unitOfMeasurement}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600">{fmt(Number(p.sellingPrice))}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(Number(p.stockQuantity) * Number(p.sellingPrice))}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isLow ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isLow ? '⚠ Low Stock' : '✓ OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
