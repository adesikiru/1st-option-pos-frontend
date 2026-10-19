'use client';

import React, { useRef } from 'react';
import { Sale } from '@/lib/types';
import { Printer, X, CheckCircle, Flame } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ sale, isOpen, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg">Transaction Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div className="overflow-y-auto p-6 flex-1 print:p-0 print:overflow-visible">
          <div
            ref={receiptRef}
            className="receipt-content font-mono text-slate-800 text-sm max-w-sm mx-auto p-4 border border-dashed border-slate-300 rounded-lg print:border-none print:p-0"
          >
            {/* Header / Branding */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="font-bold text-base tracking-wider uppercase text-slate-950">
                1st Option Energy Mart
              </h1>
              <p className="text-xs text-slate-500">Retail & Convenience Mart</p>
              <p className="text-xs text-slate-500">Web: https://1stoption.com</p>
            </div>

            {/* Transaction Info */}
            <div className="py-3 text-xs border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{sale.cashier?.name || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold text-slate-900">{sale.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-semibold ${
                    sale.status === 'COMPLETED' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {sale.status}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left">
                    <th className="pb-1 font-semibold">Item</th>
                    <th className="pb-1 text-center font-semibold">Qty</th>
                    <th className="pb-1 text-right font-semibold">Price</th>
                    <th className="pb-1 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, index) => (
                    <tr key={index} className="py-1">
                      <td className="py-1.5 pr-2">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.sku}</div>
                      </td>
                      <td className="py-1.5 text-center text-slate-700">{Number(item.quantity)}</td>
                      <td className="py-1.5 text-right text-slate-700">
                        ₦{Number(item.unitPrice).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-slate-900">
                        ₦{Number(item.totalPrice).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>
                  ₦{Number(sale.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {Number(sale.discountTotal) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>
                    -₦{Number(sale.discountTotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {Number(sale.taxTotal) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span>
                    ₦{Number(sale.taxTotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-950 pt-1 border-t border-slate-200">
                <span>TOTAL AMOUNT:</span>
                <span>
                  ₦{Number(sale.totalAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 text-[11px] text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">Thank you for shopping with us!</p>
              <p>Please keep this receipt for your records.</p>
              <p className="text-[10px] text-slate-400">Powered by 1st Option POS System</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
