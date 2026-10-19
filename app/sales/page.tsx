'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';
import { Sale } from '@/lib/types';
import ReceiptModal from '@/components/ReceiptModal';
import {
  Receipt, Search, Calendar, X, ChevronLeft, ChevronRight,
  Eye, Ban, RefreshCw, Filter
} from 'lucide-react';

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  VOIDED: 'bg-rose-50 text-rose-700',
  REFUNDED: 'bg-amber-50 text-amber-700',
};
const PM_LABEL: Record<string, string> = {
  CASH: 'Cash', BANK_TRANSFER: 'Transfer', POS_CARD: 'POS/Card', SPLIT: 'Split',
};

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSales({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        receiptNumber: receiptNumber || undefined,
        page,
        limit: LIMIT,
      });
      setSales(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, receiptNumber, page]);

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  useEffect(() => { setPage(1); }, [dateFrom, dateTo, receiptNumber]);

  const handleViewSale = async (id: string) => {
    try {
      const sale = await api.getSale(id);
      setSelectedSale(sale);
      setShowReceipt(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVoid = async (sale: Sale) => {
    const reason = prompt(`Void sale ${sale.receiptNumber}?\nEnter reason:`);
    if (!reason) return;
    try {
      await api.voidSale(sale.id, reason);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" /> Sales History
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} transactions found</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder="Search receipt number…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {receiptNumber && <button onClick={() => setReceiptNumber('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 text-left font-semibold">Receipt No.</th>
                <th className="px-5 py-3 text-left font-semibold">Date & Time</th>
                <th className="px-5 py-3 text-left font-semibold">Cashier</th>
                <th className="px-5 py-3 text-center font-semibold">Items</th>
                <th className="px-5 py-3 text-left font-semibold">Payment</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">
                  No sales found for the selected filters.
                </td></tr>
              ) : sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3 font-mono text-blue-700 font-bold text-xs">{s.receiptNumber}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {new Date(s.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <div className="text-slate-400">{new Date(s.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{s.cashier?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{s.items?.length ?? 0}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{PM_LABEL[s.paymentMethod] ?? s.paymentMethod}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(Number(s.totalAmount))}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[s.status] ?? ''}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewSale(s.id)} title="View & Print Receipt"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {s.status === 'COMPLETED' && (
                        <button onClick={() => handleVoid(s)} title="Void Sale"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm bg-slate-50">
            <span className="text-slate-500">Page {page} of {totalPages} · {total} results</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ReceiptModal sale={selectedSale} isOpen={showReceipt} onClose={() => setShowReceipt(false)} />
    </div>
  );
}
