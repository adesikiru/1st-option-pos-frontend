'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Sale } from '@/lib/types';
import ReceiptPreview from './ReceiptPreview';
import {
  Receipt, Search, Calendar, X, ChevronLeft, ChevronRight,
  Eye, Ban, RefreshCw, Printer, AlertCircle, CheckCircle2
} from 'lucide-react';

interface SalesHistoryProps {
  onSaleSelect?: (sale: Sale) => void;
}

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VOIDED: 'bg-rose-50 text-rose-700 border-rose-200',
  REFUNDED: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PM_LABEL: Record<string, string> = {
  CASH: 'Cash', BANK_TRANSFER: 'Transfer', POS_CARD: 'POS/Card', SPLIT: 'Split',
};

export default function SalesHistory({ onSaleSelect }: SalesHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const LIMIT = 20;

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError('');
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
    } catch (err: any) {
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, receiptNumber, page]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, receiptNumber]);

  const handlePrintReceipt = async (saleId: string) => {
    try {
      const fullSale = await api.getSale(saleId);
      setSelectedSale(fullSale);
      setShowReceiptModal(true);
      if (onSaleSelect) {
        onSaleSelect(fullSale);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve receipt details');
    }
  };

  const handleVoid = async (sale: Sale) => {
    const reason = prompt(`Void sale ${sale.receiptNumber}?\nEnter reason:`);
    if (!reason) return;
    try {
      await api.voidSale(sale.id, reason);
      loadSales();
    } catch (err: any) {
      alert(err.message || 'Failed to void sale');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder="Search by receipt number (e.g. RCP-…)…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {receiptNumber && (
            <button
              onClick={() => setReceiptNumber('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-slate-400 text-xs">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={loadSales}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh sales list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-100 text-[11px]">
                <th className="px-5 py-3 text-left font-bold">Receipt No.</th>
                <th className="px-5 py-3 text-left font-bold">Date & Time</th>
                <th className="px-5 py-3 text-left font-bold">Cashier</th>
                <th className="px-5 py-3 text-center font-bold">Items</th>
                <th className="px-5 py-3 text-left font-bold">Payment</th>
                <th className="px-5 py-3 text-right font-bold">Amount</th>
                <th className="px-5 py-3 text-left font-bold">Status</th>
                <th className="px-5 py-3 text-right font-bold">Receipt Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 text-xs mt-2">Loading transactions…</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-xs">
                    No transactions found for the specified filters.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono text-emerald-800 font-bold text-xs">
                      {sale.receiptNumber}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div>
                        {new Date(sale.createdAt).toLocaleDateString('en-NG', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {sale.cashier?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {sale.items?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {PM_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900 text-xs">
                      {fmt(Number(sale.totalAmount))}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          STATUS_STYLES[sale.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          id={`reprint-btn-${sale.id}`}
                          onClick={() => handlePrintReceipt(sale.id)}
                          title="View & Print Thermal Receipt"
                          className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint</span>
                        </button>
                        {sale.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleVoid(sale)}
                            title="Void Sale"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50">
            <span className="text-slate-500">
              Page {page} of {totalPages} · {total} receipts
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ReceiptPreview
        sale={selectedSale}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        isReprint={true}
      />
    </div>
  );
}
