'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Category, Product, Supplier, ProductStatistics } from '@/lib/types';
import {
  X,
  Package,
  History,
  BarChart2,
  Save,
  AlertCircle,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  RefreshCw,
  Clock,
  User,
  Sliders,
} from 'lucide-react';
import { api } from '@/lib/api';

const fmt = (n: number) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

interface QuickBooksItemModalProps {
  product: Product | null;
  isOpen: boolean;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickBooksItemModal({
  product,
  isOpen,
  categories,
  suppliers,
  onClose,
  onSuccess,
}: QuickBooksItemModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'statistics'>('details');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    supplierId: '',
    unitOfMeasurement: 'pcs',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minStockThreshold: '5',
    adjustmentReason: 'QuickBooks inventory edit',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Statistics & History State
  const [stats, setStats] = useState<ProductStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async (productId: string) => {
    setStatsLoading(true);
    try {
      const data = await api.getProductStatistics(productId);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load product statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        unitOfMeasurement: product.unitOfMeasurement || 'pcs',
        costPrice: String(product.costPrice),
        sellingPrice: String(product.sellingPrice),
        stockQuantity: String(product.stockQuantity),
        minStockThreshold: String(product.minStockThreshold),
        adjustmentReason: 'Physical inventory update',
      });
      loadStats(product.id);
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        categoryId: categories[0]?.id || '',
        supplierId: '',
        unitOfMeasurement: 'pcs',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '0',
        minStockThreshold: '5',
        adjustmentReason: 'Initial stock entry',
      });
      setStats(null);
    }
    setError('');
    setSuccess('');
    setActiveTab('details');
  }, [product, categories, loadStats]);

  if (!isOpen) return null;

  const cost = parseFloat(formData.costPrice) || 0;
  const price = parseFloat(formData.sellingPrice) || 0;
  const onHand = parseFloat(formData.stockQuantity) || 0;
  const profitMarginAmount = price - cost;
  const profitMarginPct = price > 0 ? ((profitMarginAmount / price) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        supplierId: formData.supplierId || undefined,
        unitOfMeasurement: formData.unitOfMeasurement || 'pcs',
        costPrice: cost,
        sellingPrice: price,
        minStockThreshold: parseFloat(formData.minStockThreshold) || 5,
        stockQuantity: onHand,
      };

      if (!product) {
        await api.createProduct(payload);
        setSuccess('Product created successfully');
      } else {
        await api.updateProduct(product.id, payload);
        setSuccess('Product updated successfully');
        loadStats(product.id);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-5 border-b border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-emerald-500/20">
                <Package className="w-5 h-5 font-bold" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-lg text-white truncate">
                    {product ? product.name : 'Add New Inventory Item'}
                  </h2>
                  {product && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {product.sku}
                    </span>
                  )}
                  {product && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      On-Hand: {Number(product.stockQuantity)} {product.unitOfMeasurement}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">QuickBooks-Style Item Management & History</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* QuickBooks Style Tabs */}
          {product && (
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'details'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4" /> Item Details & Stock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'history'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" /> Product History ({stats?.history?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('statistics')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'statistics'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-4 h-4" /> Statistics (In / Out / Profit)
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 thin-scroll">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: DETAILS & EDITABLE STOCK */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Financial Quick Preview Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Cost</p>
                  <p className="text-base font-bold text-slate-800">{fmt(cost)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Price</p>
                  <p className="text-base font-bold text-emerald-700">{fmt(price)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Markup / Margin</p>
                  <p className="text-base font-bold text-blue-600">
                    {fmt(profitMarginAmount)} <span className="text-xs">({profitMarginPct}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extended Cost (On-Hand)</p>
                  <p className="text-base font-bold text-slate-900">{fmt(onHand * cost)}</p>
                </div>
              </div>

              {/* General Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" /> General Item Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Coca-Cola 500ml Bottle"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      SKU / Item Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. BEV-COC-500"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Barcode / UPC
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Scan or enter barcode"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    >
                      <option value="">Select Department...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vendor / Supplier
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    >
                      <option value="">No Vendor Assigned</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock - QuickBooks Direct Editable */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Pricing & Inventory Levels
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cost Price (₦) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selling Price (₦) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      value={formData.unitOfMeasurement}
                      onChange={(e) => setFormData({ ...formData, unitOfMeasurement: e.target.value })}
                      placeholder="pcs, pack, carton, kg"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* QuickBooks On-Hand Quantity Adjustment */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        On-Hand Quantity (QuickBooks Editable)
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Directly adjust count. Changes are automatically logged to item history.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-200 text-amber-900">
                      Current: {product ? Number(product.stockQuantity) : 0} {formData.unitOfMeasurement}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        New On-Hand Count
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-base font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Reorder / Min Stock Alert
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minStockThreshold}
                        onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Description & Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes, size, weight or instructions..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving Item...' : product ? 'Save Item Changes' : 'Create Inventory Item'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ITEM OR PRODUCT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Product Movement History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed ledger showing change date, on-hand quantity, reference, and staff.
                  </p>
                </div>
                <button
                  onClick={() => product && loadStats(product.id)}
                  disabled={statsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !stats?.history?.length ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No movement or change history recorded for this item yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Change Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Qty Change</th>
                        <th className="px-4 py-3 text-right">On-Hand Qty</th>
                        <th className="px-4 py-3">Reason / Reference</th>
                        <th className="px-4 py-3">Changed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.history.map((m) => {
                        const qtyNum = Number(m.quantity);
                        const isPositive = qtyNum > 0;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">
                              {new Date(m.changeDate).toLocaleString('en-NG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {m.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span
                                className={`font-bold text-xs inline-flex items-center gap-1 ${
                                  isPositive ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {isPositive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                {isPositive ? `+${qtyNum}` : qtyNum} {product?.unitOfMeasurement}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-slate-900 text-xs whitespace-nowrap">
                              {m.onHandQuantity} {product?.unitOfMeasurement}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                              {m.reason || m.reference || '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {m.changedBy}
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

          {/* TAB 3: PRODUCT STATISTICS (TOTALS, IN / OUT) */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats ? (
                <>
                  {/* Totals Section */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Performance & Profitability Totals
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Sales</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">{fmt(stats.totals.netSales)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{stats.totals.totalQtySold} units sold</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost of Goods (COGS)</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">{fmt(stats.totals.costOfGoods)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">At unit cost</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Gross Profit</p>
                        <p className="text-xl font-extrabold text-emerald-700 mt-1">{fmt(stats.totals.profit)}</p>
                        <p className="text-[11px] text-emerald-600 mt-0.5">Net sales minus cost</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Profit Margin</p>
                        <p className="text-xl font-extrabold text-blue-700 mt-1">{stats.totals.profitMargin}%</p>
                        <p className="text-[11px] text-blue-600 mt-0.5">Realized margin</p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity In & Quantity Out Breakdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Quantity In */}
                    <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-bold text-sm text-emerald-950 uppercase tracking-wider">
                            Quantity In
                          </h4>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                          Total In: {stats.quantityIn.total} {product?.unitOfMeasurement}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm py-1.5 border-b border-emerald-100">
                          <span className="text-slate-700">Received (from Receipts / Vendors)</span>
                          <span className="font-bold text-slate-900">{stats.quantityIn.received}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1.5 border-b border-emerald-100">
                          <span className="text-slate-700">Sales Returns (Customer Returns)</span>
                          <span className="font-bold text-slate-900">{stats.quantityIn.salesReturns}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1.5 border-b border-emerald-100">
                          <span className="text-slate-700">Adjustments (Positive Counts)</span>
                          <span className="font-bold text-slate-900">{stats.quantityIn.adjustments}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="text-slate-700">Transfers In</span>
                          <span className="font-bold text-slate-900">{stats.quantityIn.transfers}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Out */}
                    <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-5 h-5 text-rose-600" />
                          <h4 className="font-bold text-sm text-rose-950 uppercase tracking-wider">
                            Quantity Out
                          </h4>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-rose-600 text-white">
                          Total Out: {stats.quantityOut.total} {product?.unitOfMeasurement}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm py-1.5 border-b border-rose-100">
                          <span className="text-slate-700">Sold (Customer Purchases)</span>
                          <span className="font-bold text-slate-900">{stats.quantityOut.sold}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1.5 border-b border-rose-100">
                          <span className="text-slate-700">Vendor Returns</span>
                          <span className="font-bold text-slate-900">{stats.quantityOut.vendorReturns}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1.5 border-b border-rose-100">
                          <span className="text-slate-700">Adjustments & Damages / Expired</span>
                          <span className="font-bold text-slate-900">{stats.quantityOut.adjustments}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="text-slate-700">Transfers Out</span>
                          <span className="font-bold text-slate-900">{stats.quantityOut.transfers}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Inventory Valuation */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between flex-wrap gap-4 shadow-lg">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Current On-Hand Inventory
                      </p>
                      <p className="text-2xl font-black mt-0.5">
                        {stats.product.onHandQty} {stats.product.unitOfMeasurement}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Extended Cost</p>
                        <p className="text-base font-bold text-slate-200">{fmt(stats.product.extCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Extended Retail Value</p>
                        <p className="text-base font-bold text-emerald-400">{fmt(stats.product.extPrice)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Failed to load product statistics.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
