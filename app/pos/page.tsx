'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken, getStoredUser } from '@/lib/api';
import { Product, PaymentMethod, Sale } from '@/lib/types';
import ReceiptModal from '@/components/ReceiptModal';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote,
  Building2, Layers, AlertCircle, CheckCircle2, X, Package, ScanLine,
  Percent
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // per-item absolute discount
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const user = getStoredUser();

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    searchRef.current?.focus();
  }, [router]);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return; }
    setLoadingProducts(true);
    try {
      const res = await api.getProducts({ search: q, limit: 12 });
      setProducts(res.data.filter((p) => p.isActive && Number(p.stockQuantity) > 0));
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > Number(product.stockQuantity)) {
          setError(`Only ${product.stockQuantity} ${product.unitOfMeasurement} of "${product.name}" available.`);
          return prev;
        }
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: newQty } : i);
      }
      if (Number(product.stockQuantity) < 1) {
        setError(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
    setError('');
    setSearchQuery('');
    setProducts([]);
    searchRef.current?.focus();
  };

  const updateQty = (productId: string, qty: number) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      const max = Number(item.product.stockQuantity);
      if (qty < 1) return prev.filter((i) => i.product.id !== productId);
      if (qty > max) { setError(`Max available: ${max} ${item.product.unitOfMeasurement}`); return prev; }
      return prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i);
    });
    setError('');
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, discount: Math.max(0, discount) } : i)
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setNotes('');
    setError('');
    searchRef.current?.focus();
  };

  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.product.sellingPrice) * i.quantity, 0);
  const totalDiscount = cartItems.reduce((sum, i) => sum + i.discount * i.quantity, 0);
  const total = Math.max(0, subtotal - totalDiscount);

  const handleCheckout = async () => {
    if (cartItems.length === 0) { setError('Cart is empty.'); return; }
    setError('');
    setLoading(true);
    try {
      const sale = await api.createSale({
        items: cartItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          discount: i.discount,
        })),
        paymentMethod,
        notes: notes.trim() || undefined,
        idempotencyKey: `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
      setCompletedSale(sale);
      setShowReceipt(true);
      setCartItems([]);
      setNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pmOptions: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" />, color: 'emerald' },
    { value: 'POS_CARD', label: 'POS/Card', icon: <CreditCard className="w-4 h-4" />, color: 'blue' },
    { value: 'BANK_TRANSFER', label: 'Transfer', icon: <Building2 className="w-4 h-4" />, color: 'violet' },
    { value: 'SPLIT', label: 'Split', icon: <Layers className="w-4 h-4" />, color: 'amber' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-6 h-[calc(100vh-9rem)] max-h-[840px]">
        {/* LEFT: Product Search */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" /> POS Terminal
            </h1>
            <span className="text-xs text-slate-400">Cashier: <strong className="text-slate-600">{user?.name}</strong></span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {loadingProducts
                ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                : <Search className="w-5 h-5 text-slate-400" />
              }
            </div>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU or scan barcode…"
              id="pos-search"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-sm bg-white shadow-sm transition-colors"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setProducts([]); }} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-in">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Product Results */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto thin-scroll pr-1">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  id={`product-${p.id}`}
                  className="group text-left bg-white border-2 border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-2xl p-3.5 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5 group-hover:bg-emerald-100 transition-colors">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-sm text-slate-800 leading-snug line-clamp-2">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-emerald-700">{fmt(Number(p.sellingPrice))}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      Number(p.stockQuantity) <= Number(p.minStockThreshold)
                        ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {Number(p.stockQuantity)} {p.unitOfMeasurement}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <ScanLine className="w-16 h-16 mb-3 opacity-40" />
              <p className="font-semibold text-slate-400">Search for a product to begin</p>
              <p className="text-sm text-slate-300 mt-1">Type name, SKU, or scan barcode</p>
            </div>
          )}
        </div>

        {/* RIGHT: Cart */}
        <div className="w-80 xl:w-96 flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden shrink-0">
          {/* Cart header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Cart
                {cartItems.length > 0 && (
                  <span className="ml-1 text-xs bg-emerald-500 text-white rounded-full px-2 py-0.5">{cartItems.length}</span>
                )}
              </h2>
              {cartItems.length > 0 && (
                <button onClick={clearCart} className="text-slate-400 hover:text-rose-400 transition-colors text-xs flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm text-slate-400">Cart is empty</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const lineTotal = Number(item.product.sellingPrice) * item.quantity - item.discount * item.quantity;
                return (
                  <div key={item.product.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-slate-800 leading-tight line-clamp-2">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400">{item.product.sku}</p>
                      </div>
                      <button onClick={() => removeItem(item.product.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={Number(item.product.stockQuantity)}
                          value={item.quantity}
                          onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center text-sm font-bold border border-slate-200 rounded-lg py-0.5"
                        />
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">{fmt(lineTotal)}</span>
                    </div>
                    {/* Discount input */}
                    <div className="flex items-center gap-2 mt-2">
                      <Percent className="w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        placeholder="Discount (₦)"
                        value={item.discount || ''}
                        onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                        className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span><span>-{fmt(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total</span><span className="text-emerald-700">{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {pmOptions.map((opt) => (
                  <button
                    key={opt.value}
                    id={`pay-${opt.value.toLowerCase()}`}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      paymentMethod === opt.value
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add note (optional)…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
            />

            {/* Checkout button */}
            <button
              id="checkout-btn"
              onClick={handleCheckout}
              disabled={loading || cartItems.length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Complete Sale · {fmt(total)}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal sale={completedSale} isOpen={showReceipt} onClose={() => setShowReceipt(false)} />
    </div>
  );
}
