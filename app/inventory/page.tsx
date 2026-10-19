'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken, getStoredUser } from '@/lib/api';
import { Product, StockMovement } from '@/lib/types';
import {
  Boxes, AlertTriangle, TrendingDown, TrendingUp, RefreshCw,
  ChevronLeft, ChevronRight, Sliders, CheckCircle2, X
} from 'lucide-react';

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  SALE: { label: 'Sale', color: 'bg-blue-50 text-blue-700' },
  INITIAL_STOCK: { label: 'Initial Stock', color: 'bg-emerald-50 text-emerald-700' },
  PURCHASE_RECEIPT: { label: 'Stock Receipt', color: 'bg-violet-50 text-violet-700' },
  DAMAGE_EXPIRED: { label: 'Damage/Expired', color: 'bg-rose-50 text-rose-700' },
  MANUAL_ADJUSTMENT: { label: 'Manual Adj.', color: 'bg-amber-50 text-amber-700' },
  RETURN_REFUND: { label: 'Return/Refund', color: 'bg-teal-50 text-teal-700' },
};

export default function InventoryPage() {
  const router = useRouter();
  const user = getStoredUser();
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movTotal, setMovTotal] = useState(0);
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Adjustment form
  const [adjustProduct, setAdjustProduct] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'MANUAL_ADJUSTMENT' | 'DAMAGE_EXPIRED' | 'INITIAL_STOCK'>('MANUAL_ADJUSTMENT');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const canAdjust = ['ADMIN', 'MANAGER', 'INVENTORY_OFFICER'].includes(user?.role ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ls, movRes, prods] = await Promise.all([
        api.getLowStockProducts(),
        api.getMovements({ page: movPage, limit: 20 }),
        api.getProducts({ limit: 200 }),
      ]);
      setLowStock(ls);
      setMovements(movRes.data);
      setMovTotal(movRes.total);
      setMovTotalPages(movRes.totalPages);
      setAllProducts(prods.data.filter(p => p.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [movPage]);

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccess('');
    if (!adjustProduct || !adjustQty) { setAdjustError('Select a product and enter quantity.'); return; }
    setAdjustLoading(true);
    try {
      await api.adjustStock({
        productId: adjustProduct,
        quantity: parseFloat(adjustQty),
        type: adjustType,
        reason: adjustReason.trim() || undefined,
      });
      setAdjustSuccess('Stock adjustment saved successfully.');
      setAdjustProduct('');
      setAdjustQty('');
      setAdjustReason('');
      load();
    } catch (err: any) {
      setAdjustError(err.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-600" /> Inventory Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Track stock levels and movements</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-amber-800">Low Stock Alerts ({lowStock.length})</h2>
          </div>
          <div className="overflow-y-auto thin-scroll max-h-80">
            {lowStock.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">All products are well stocked.</div>
            ) : lowStock.map((p) => (
              <div key={p.id} className="px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">{p.sku}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">Min: {Number(p.minStockThreshold)} {p.unitOfMeasurement}</span>
                  <span className="text-sm font-bold text-amber-700">
                    {Number(p.stockQuantity)} {p.unitOfMeasurement} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Adjustment Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-600" />
            <h2 className="font-semibold text-slate-800">Record Stock Adjustment</h2>
          </div>
          <div className="p-5">
            {!canAdjust ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm">
                You do not have permission to record stock adjustments.
              </div>
            ) : (
              <form onSubmit={handleAdjust} className="space-y-4">
                {adjustError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    <X className="w-4 h-4 shrink-0" />{adjustError}
                  </div>
                )}
                {adjustSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />{adjustSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Product *</label>
                    <select
                      value={adjustProduct}
                      onChange={(e) => setAdjustProduct(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select product…</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({Number(p.stockQuantity)} in stock)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Adjustment Type *</label>
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="MANUAL_ADJUSTMENT">Manual Adjustment (+/-)</option>
                      <option value="DAMAGE_EXPIRED">Damage / Expired (removes stock)</option>
                      <option value="INITIAL_STOCK">Initial Stock Entry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Quantity * {adjustType === 'DAMAGE_EXPIRED' ? '(enter as negative, e.g. -5)' : ''}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder={adjustType === 'DAMAGE_EXPIRED' ? '-5' : '10'}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Reason / Notes</label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g. Spoilage, count correction…"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-95 shadow-md"
                >
                  {adjustLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Adjustment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Stock Movement History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-slate-600" />
          <h2 className="font-semibold text-slate-800">Stock Movement History</h2>
          <span className="ml-auto text-xs text-slate-400">{movTotal} records</span>
        </div>
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 text-left font-semibold">Product</th>
                <th className="px-5 py-3 text-left font-semibold">Type</th>
                <th className="px-5 py-3 text-right font-semibold">Qty</th>
                <th className="px-5 py-3 text-right font-semibold">Before</th>
                <th className="px-5 py-3 text-right font-semibold">After</th>
                <th className="px-5 py-3 text-left font-semibold">By</th>
                <th className="px-5 py-3 text-left font-semibold">Reference</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">No stock movements recorded yet.</td></tr>
              ) : movements.map((m) => {
                const mv = MOVEMENT_LABELS[m.movementType] ?? { label: m.movementType, color: 'bg-slate-100 text-slate-600' };
                const isNeg = Number(m.quantity) < 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-sm text-slate-800">{m.product?.name ?? '—'}</div>
                      <div className="text-xs text-slate-400 font-mono">{m.product?.sku}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${mv.color}`}>{mv.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-sm flex items-center justify-end gap-1 ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isNeg ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {Number(m.quantity) > 0 ? '+' : ''}{Number(m.quantity)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">{Number(m.previousQty)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700 text-xs">{Number(m.newQty)}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{m.user?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{m.reference ?? m.reason ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(m.createdAt).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {movTotalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm bg-slate-50">
            <span className="text-slate-500">Page {movPage} of {movTotalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setMovPage(p => Math.max(1, p - 1))} disabled={movPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setMovPage(p => Math.min(movTotalPages, p + 1))} disabled={movPage >= movTotalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
