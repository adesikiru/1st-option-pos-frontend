'use client';

import React from 'react';
import { Product } from '@/lib/types';
import CartItem, { CartLine } from './CartItem';
import SaleSummary from './SaleSummary';
import { ShoppingCart, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface POSCartProps {
  cartItems: CartLine[];
  onUpdateQty: (productId: string, quantity: number) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  loading?: boolean;
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function POSCart({
  cartItems,
  onUpdateQty,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  loading = false,
}: POSCartProps) {
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.product.sellingPrice) * item.quantity, 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + item.discount * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - totalDiscount);

  return (
    <div className="w-80 xl:w-96 flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden shrink-0 h-full">
      {/* Cart Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            Cart
            {cartItems.length > 0 && (
              <span className="ml-1 text-xs bg-emerald-500 text-white font-semibold rounded-full px-2 py-0.5">
                {cartItems.length} lines ({totalUnits} pcs)
              </span>
            )}
          </h2>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              title="Clear all items from cart"
              className="text-slate-400 hover:text-rose-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto thin-scroll p-3.5 space-y-2.5 min-h-0 bg-slate-50/40">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <ShoppingCart className="w-8 h-8 opacity-60" />
            </div>
            <p className="text-sm font-bold text-slate-600">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Scan a barcode or use manual search to add products to this sale
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onUpdateQty={onUpdateQty}
              onUpdateDiscount={onUpdateDiscount}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Cart Footer / Checkout Trigger */}
      <div className="border-t border-slate-200 p-4 space-y-3 bg-white shrink-0">
        {cartItems.length > 0 && <SaleSummary cartItems={cartItems} />}

        <button
          type="button"
          id="proceed-checkout-btn"
          onClick={onOpenCheckout}
          disabled={loading || cartItems.length === 0}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Pay & Checkout · {fmt(totalAmount)}</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
