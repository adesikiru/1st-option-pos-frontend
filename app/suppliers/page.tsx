'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';
import { Supplier, Product, StockReceipt } from '@/lib/types';
import {
  Truck, Plus, Edit2, RefreshCw, Package, CheckCircle2, X,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);

  // Supplier form
  const [sName, setSName] = useState('');
  const [sContact, setSContact] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sNotes, setSNotes] = useState('');
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState('');

  // Receive stock form
  const [rSupplierId, setRSupplierId] = useState('');
  const [rReceiptNo, setRReceiptNo] = useState('');
  const [rNotes, setRNotes] = useState('');
  const [rItems, setRItems] = useState([{ productId: '', quantity: '', unitCost: '' }]);
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError] = useState('');
  const [rSuccess, setRSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sups, prods, recs] = await Promise.all([
        api.getSuppliers(),
        api.getProducts({ limit: 200 }),
        api.getStockReceipts(),
      ]);
      setSuppliers(sups);
      setProducts(prods.data.filter((p) => p.isActive));
      setReceipts(recs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  const openSupplierForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditSupplier(supplier);
      setSName(supplier.name); setSContact(supplier.contactPerson ?? '');
      setSPhone(supplier.phone ?? ''); setSEmail(supplier.email ?? '');
      setSAddress(supplier.address ?? ''); setSNotes(supplier.notes ?? '');
    } else {
      setEditSupplier(null);
      setSName(''); setSContact(''); setSPhone(''); setSEmail(''); setSAddress(''); setSNotes('');
    }
    setSError('');
    setShowSupplierForm(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSError('');
    setSLoading(true);
    try {
      const data = { name: sName.trim(), contactPerson: sContact.trim() || undefined, phone: sPhone.trim() || undefined, email: sEmail.trim() || undefined, address: sAddress.trim() || undefined, notes: sNotes.trim() || undefined };
      if (editSupplier) await api.updateSupplier(editSupplier.id, data);
      else await api.createSupplier(data);
      setShowSupplierForm(false);
      load();
    } catch (err: any) { setSError(err.message); }
    finally { setSLoading(false); }
  };

  const addRItem = () => setRItems((p) => [...p, { productId: '', quantity: '', unitCost: '' }]);
  const removeRItem = (i: number) => setRItems((p) => p.filter((_, idx) => idx !== i));
  const updateRItem = (i: number, field: string, val: string) =>
    setRItems((p) => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setRError(''); setRSuccess('');
    if (!rReceiptNo.trim()) { setRError('Receipt number is required.'); return; }
    const validItems = rItems.filter((it) => it.productId && it.quantity && it.unitCost);
    if (validItems.length === 0) { setRError('Add at least one product line item.'); return; }
    setRLoading(true);
    try {
      await api.receiveStock({
        supplierId: rSupplierId || undefined,
        receiptNumber: rReceiptNo.trim(),
        notes: rNotes.trim() || undefined,
        items: validItems.map((it) => ({ productId: it.productId, quantity: parseFloat(it.quantity), unitCost: parseFloat(it.unitCost) })),
      });
      setRSuccess('Stock receipt saved. Inventory has been updated.');
      setRSupplierId(''); setRReceiptNo(''); setRNotes('');
      setRItems([{ productId: '', quantity: '', unitCost: '' }]);
      setShowReceiveForm(false);
      load();
    } catch (err: any) { setRError(err.message); }
    finally { setRLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" /> Suppliers & Stock Receiving
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{suppliers.length} supplier(s) registered</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowReceiveForm(!showReceiveForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95">
            <Package className="w-4 h-4" /> Receive Stock
          </button>
          <button onClick={() => openSupplierForm()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold text-sm transition-all">
            <Plus className="w-4 h-4" /> New Supplier
          </button>
        </div>
      </div>

      {/* Receive Stock Form */}
      {showReceiveForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in space-y-4">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Package className="w-5 h-5 text-teal-600" /> Record Stock Receipt</h2>
          <form onSubmit={handleReceiveStock} className="space-y-4">
            {rError && <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"><AlertCircle className="w-4 h-4" />{rError}</div>}
            {rSuccess && <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"><CheckCircle2 className="w-4 h-4" />{rSuccess}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Supplier</label>
                <select value={rSupplierId} onChange={(e) => setRSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">No specific supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Receipt / Waybill No. *</label>
                <input type="text" required value={rReceiptNo} onChange={(e) => setRReceiptNo(e.target.value)} placeholder="e.g. WB-20261001"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Notes</label>
                <input type="text" value={rNotes} onChange={(e) => setRNotes(e.target.value)} placeholder="Optional notes…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>

            {/* Line items */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Products Received *</label>
              <div className="space-y-2">
                {rItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <select value={item.productId} onChange={(e) => updateRItem(i, 'productId', e.target.value)} required
                      className="flex-1 min-w-48 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                      <option value="">Select product…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input type="number" step="0.01" min="0.01" required value={item.quantity}
                      onChange={(e) => updateRItem(i, 'quantity', e.target.value)} placeholder="Qty"
                      className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    <input type="number" step="0.01" min="0" required value={item.unitCost}
                      onChange={(e) => updateRItem(i, 'unitCost', e.target.value)} placeholder="Unit Cost (₦)"
                      className="w-36 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    {rItems.length > 1 && (
                      <button type="button" onClick={() => removeRItem(i)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addRItem}
                className="mt-2 flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-semibold">
                <Plus className="w-4 h-4" /> Add another product
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={rLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-95 shadow-md">
                {rLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Stock Receipt
              </button>
              <button type="button" onClick={() => setShowReceiveForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Truck className="w-4 h-4 text-teal-400" />{editSupplier ? 'Edit Supplier' : 'New Supplier'}</h2>
              <button onClick={() => setShowSupplierForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              {sError && <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"><AlertCircle className="w-4 h-4" />{sError}</div>}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Supplier Name *</label>
                <input type="text" required value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Company name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Contact Person</label>
                  <input type="text" value={sContact} onChange={(e) => setSContact(e.target.value)} placeholder="Full name"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Phone</label>
                  <input type="tel" value={sPhone} onChange={(e) => setSPhone(e.target.value)} placeholder="+234…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
                <input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} placeholder="supplier@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Address / Notes</label>
                <textarea rows={2} value={sAddress} onChange={(e) => setSAddress(e.target.value)} placeholder="Address"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={sLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all active:scale-95">
                  {sLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editSupplier ? 'Update' : 'Create Supplier'}
                </button>
                <button type="button" onClick={() => setShowSupplierForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400 text-sm">No suppliers yet. Add your first supplier.</div>
        ) : suppliers.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-teal-600" />
              </div>
              <button onClick={() => openSupplierForm(s)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-slate-900 mt-3">{s.name}</h3>
            {s.contactPerson && <p className="text-sm text-slate-500 mt-0.5">{s.contactPerson}</p>}
            {s.phone && <p className="text-xs text-slate-400 mt-1">📞 {s.phone}</p>}
            {s.email && <p className="text-xs text-slate-400">✉️ {s.email}</p>}
          </div>
        ))}
      </div>

      {/* Stock Receipts History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-600" /> Stock Receipt History ({receipts.length})
          </h2>
        </div>
        {receipts.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">No stock receipts recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {receipts.slice(0, 15).map((r) => (
              <div key={r.id}>
                <button onClick={() => setExpandedReceipt(expandedReceipt === r.id ? null : r.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-teal-700 font-bold text-xs">{r.receiptNumber}</span>
                    <span className="text-sm text-slate-700">{r.supplier?.name ?? 'Direct/Unknown'}</span>
                    <span className="text-xs text-slate-400">{r.items?.length ?? 0} items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900 text-sm">{fmt(Number(r.totalCost))}</span>
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
                    {expandedReceipt === r.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedReceipt === r.id && (
                  <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                    <table className="w-full text-sm mt-3">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="pb-1.5 text-left">Product</th>
                          <th className="pb-1.5 text-right">Qty</th>
                          <th className="pb-1.5 text-right">Unit Cost</th>
                          <th className="pb-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.items?.map((it) => (
                          <tr key={it.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 text-slate-700">{it.product?.name ?? '—'}</td>
                            <td className="py-1.5 text-right text-slate-600">{Number(it.quantity)}</td>
                            <td className="py-1.5 text-right text-slate-600">{fmt(Number(it.unitCost))}</td>
                            <td className="py-1.5 text-right font-semibold text-slate-800">{fmt(Number(it.totalCost))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
