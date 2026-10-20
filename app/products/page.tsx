'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';
import { Product, Category, Supplier } from '@/lib/types';
import ProductModal from '@/components/ProductModal';
import {
  Plus, Search, Package, AlertTriangle, Edit2, PowerOff,
  Filter, RefreshCw, ChevronLeft, ChevronRight, X, AlertCircle
} from 'lucide-react';

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

// Deactivate confirmation modal
function DeactivateModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: Product | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Deactivate Product</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-slate-700 text-sm leading-relaxed">
            Deactivate{' '}
            <span className="font-bold text-slate-900">&ldquo;{product.name}&rdquo;</span>?
            <br />
            It will no longer appear in the POS.
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            You can re-activate it later by editing the product.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const LIMIT = 20;

  // Deactivate modal state
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, cats, sups] = await Promise.all([
        api.getProducts({ search, categoryId, lowStock: lowStockOnly || undefined, page, limit: LIMIT }),
        api.getCategories(),
        api.getSuppliers().catch(() => [] as Supplier[]), // Non-critical; some roles can't read suppliers
      ]);
      setProducts(prodRes.data);
      setTotal(prodRes.total);
      setTotalPages(prodRes.totalPages);
      setCategories(cats);
      setSuppliers(sups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, lowStockOnly, page]);

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  useEffect(() => { setPage(1); }, [search, categoryId, lowStockOnly]);

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    setDeactivateLoading(true);
    setDeactivateError('');
    try {
      await api.deactivateProduct(deactivateTarget.id);
      setDeactivateTarget(null);
      load();
    } catch (err: any) {
      setDeactivateError(err.message);
    } finally {
      setDeactivateLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Deactivate modal */}
      <DeactivateModal
        product={deactivateTarget}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => { setDeactivateTarget(null); setDeactivateError(''); }}
        loading={deactivateLoading}
      />

      {/* Deactivate error toast */}
      {deactivateError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white shadow-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {deactivateError}
          <button onClick={() => setDeactivateError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-violet-600" /> Product Catalogue
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} products total</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="add-product-btn"
            onClick={() => { setEditProduct(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, barcode…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            lowStockOnly ? 'bg-amber-100 border-amber-400 text-amber-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Low Stock Only
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 text-left font-semibold">Product</th>
                <th className="px-5 py-3 text-left font-semibold">Category</th>
                <th className="px-5 py-3 text-right font-semibold">Cost</th>
                <th className="px-5 py-3 text-right font-semibold">Price</th>
                <th className="px-5 py-3 text-right font-semibold">Stock</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-sm">
                  No products found. Try adjusting your filters or add a new product.
                </td></tr>
              ) : products.map((p) => {
                const isLowStock = Number(p.stockQuantity) <= Number(p.minStockThreshold);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.sku}{p.barcode && ` · ${p.barcode}`}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {p.category?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">{fmt(Number(p.costPrice))}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(Number(p.sellingPrice))}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-sm ${isLowStock ? 'text-amber-600' : 'text-slate-700'}`}>
                        {Number(p.stockQuantity)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">{p.unitOfMeasurement}</span>
                      {isLowStock && <div className="text-[10px] text-amber-500 font-semibold">LOW</div>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditProduct(p); setModalOpen(true); }}
                          title="Edit product"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.isActive && (
                          <button
                            onClick={() => setDeactivateTarget(p)}
                            title="Deactivate product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm bg-slate-50">
            <span className="text-slate-500">Page {page} of {totalPages} · {total} products</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        product={editProduct}
        isOpen={modalOpen}
        categories={categories}
        suppliers={suppliers}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSuccess={load}
      />
    </div>
  );
}
