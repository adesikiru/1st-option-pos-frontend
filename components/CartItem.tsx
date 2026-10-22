'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { Plus, Minus, Trash2, Tag, Percent } from 'lucide-react';

export interface CartLine {
  product: Product;
  quantity: number;
  discount: number; // per-unit discount in currency
}

interface CartItemProps {
  item: CartLine;
  onUpdateQty: (productId: string, quantity: number) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  onRemove: (productId: string) => void;
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CartItem({ item, onUpdateQty, onUpdateDiscount, onRemove }: CartItemProps) {
  const { product, quantity, discount } = item;
  const unitPrice = Number(product.sellingPrice);
  const maxStock = Number(product.stockQuantity);
  const lineTotal = Math.max(0, (unitPrice - discount) * quantity);

  return (
    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 shadow-sm transition-all hover:border-slate-300">
      {/* Top: Product Info & Remove */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs text-slate-900 leading-snug line-clamp-2">
            {product.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-mono flex-wrap">
            <span>{product.sku}</span>
            {product.barcode && (
              <span className="px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 text-[10px]">
                🏷️ {product.barcode}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          title="Remove item"
          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle: Quantity controls & Line Total */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateQty(product.id, quantity - 1)}
            disabled={quantity <= 1}
            className="w-7 h-7 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors active:scale-95 shadow-2xs"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            min={1}
            max={maxStock}
            value={quantity}
            onChange={(e) => onUpdateQty(product.id, parseInt(e.target.value) || 1)}
            className="w-12 text-center text-xs font-bold border border-slate-300 rounded-lg py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => onUpdateQty(product.id, quantity + 1)}
            disabled={quantity >= maxStock}
            className="w-7 h-7 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors active:scale-95 shadow-2xs"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-slate-400 ml-0.5">
            / {maxStock} {product.unitOfMeasurement}
          </span>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-emerald-700">{fmt(lineTotal)}</div>
          <div className="text-[10px] text-slate-400">
            {fmt(unitPrice)} ea
          </div>
        </div>
      </div>

      {/* Bottom: Discount entry */}
      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-dashed border-slate-200">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Tag className="w-3 h-3 text-slate-400" />
          <span>Disc (₦):</span>
        </div>
        <input
          type="number"
          min={0}
          step="1"
          placeholder="0"
          value={discount || ''}
          onChange={(e) => onUpdateDiscount(product.id, Math.max(0, parseFloat(e.target.value) || 0))}
          className="flex-1 text-xs px-2 py-0.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
        />
        {discount > 0 && (
          <span className="text-[10px] font-semibold text-rose-600">
            -{fmt(discount * quantity)}
          </span>
        )}
      </div>
    </div>
  );
}
