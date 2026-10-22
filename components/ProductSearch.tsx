'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { Search, Package, AlertCircle, X, Loader2, Plus, Sparkles } from 'lucide-react';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
  onError: (msg: string) => void;
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProductSearch({ onSelectProduct, onError }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getProducts({ search: q.trim(), limit: 12 });
      setResults(res.data.filter((p) => p.isActive));
    } catch (err: any) {
      setResults([]);
      onError(err.message || 'Error searching products');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 280);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          {loading ? (
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          ref={searchInputRef}
          type="text"
          id="pos-manual-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Manual product search: type name, SKU, or category…"
          className="w-full pl-12 pr-10 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-sm bg-white shadow-sm transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown or Grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto thin-scroll p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
          {results.map((product) => {
            const isOutOfStock = Number(product.stockQuantity) <= 0;
            const isLowStock = Number(product.stockQuantity) <= Number(product.minStockThreshold);

            return (
              <button
                key={product.id}
                type="button"
                id={`search-item-${product.id}`}
                onClick={() => !isOutOfStock && handleSelect(product)}
                disabled={isOutOfStock}
                className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-sm active:scale-95'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-900 line-clamp-1 leading-snug">
                      {product.name}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {product.sku}
                    {product.barcode && ` · 🏷️ ${product.barcode}`}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                  <span className="font-bold text-emerald-700 text-xs">
                    {fmt(Number(product.sellingPrice))}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isOutOfStock ? 'Out of stock' : `${Number(product.stockQuantity)} ${product.unitOfMeasurement}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
