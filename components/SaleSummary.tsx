'use client';

import React from 'react';
import { CartLine } from './CartItem';
import { Receipt, Tag } from 'lucide-react';

interface SaleSummaryProps {
  cartItems: CartLine[];
  taxRate?: number; // e.g. 0.075 for 7.5% if applicable, default 0
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SaleSummary({ cartItems, taxRate = 0 }: SaleSummaryProps) {
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.product.sellingPrice) * item.quantity, 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + item.discount * item.quantity, 0);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = taxableAmount * taxRate;
  const grandTotal = taxableAmount + tax;

  return (
    <div className="space-y-2 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Items count ({cartItems.length} lines, {totalUnits} units)</span>
        <span>{fmt(subtotal)}</span>
      </div>

      {totalDiscount > 0 && (
        <div className="flex items-center justify-between text-xs text-rose-600 font-medium">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" /> Total Discount
          </span>
          <span>-{fmt(totalDiscount)}</span>
        </div>
      )}

      {tax > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>VAT ({(taxRate * 100).toFixed(1)}%)</span>
          <span>{fmt(tax)}</span>
        </div>
      )}

      <div className="pt-2 border-t-2 border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
            Total Payable
          </span>
          <span className="text-[11px] text-slate-400">Net after discounts</span>
        </div>
        <span className="text-xl font-extrabold text-emerald-700 tracking-tight">
          {fmt(grandTotal)}
        </span>
      </div>
    </div>
  );
}
