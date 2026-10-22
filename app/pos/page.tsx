'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken, getStoredUser } from '@/lib/api';
import { Product, PaymentMethod, Sale } from '@/lib/types';
import BarcodeScannerInput from '@/components/BarcodeScannerInput';
import ProductSearch from '@/components/ProductSearch';
import POSCart from '@/components/POSCart';
import { CartLine } from '@/components/CartItem';
import CheckoutDialog from '@/components/CheckoutDialog';
import ReceiptPreview from '@/components/ReceiptPreview';
import {
  ShoppingCart, AlertCircle, CheckCircle2, X, Sparkles,
  Zap, Package, Flame, Clock
} from 'lucide-react';

export default function POSPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [tenderedInfo, setTenderedInfo] = useState<{ amountTendered?: number; changeDue?: number }>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');

  const user = getStoredUser();

  useEffect(() => {
    setCurrentDateString(
      new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
    );
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!getStoredToken()) {
      router.push('/login');
    }
  }, [router]);

  // Handle global F2 shortcut to focus scanner input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const input = document.getElementById('pos-barcode-input') as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear success toast after timeout
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Add product to cart (or increment quantity if already present)
  const handleAddProduct = useCallback((product: Product) => {
    setErrorMessage('');
    const stock = Number(product.stockQuantity);

    if (stock <= 0) {
      setErrorMessage(`Cannot add "${product.name}": Product is out of stock.`);
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex >= 0) {
        const currentItem = prevItems[existingIndex];
        const newQty = currentItem.quantity + 1;

        if (newQty > stock) {
          setErrorMessage(`Max available stock for "${product.name}" is ${stock} ${product.unitOfMeasurement}.`);
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          product,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  }, []);

  // Update line quantity
  const handleUpdateQty = (productId: string, qty: number) => {
    setErrorMessage('');
    setCartItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      const max = Number(item.product.stockQuantity);
      if (qty < 1) {
        return prev.filter((i) => i.product.id !== productId);
      }
      if (qty > max) {
        setErrorMessage(`Available stock for "${item.product.name}" is ${max} ${item.product.unitOfMeasurement}.`);
        return prev;
      }
      return prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i));
    });
  };

  // Update line discount
  const handleUpdateDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, discount } : i))
    );
  };

  // Remove line item
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCartItems([]);
    setErrorMessage('');
    const input = document.getElementById('pos-barcode-input') as HTMLInputElement;
    input?.focus();
  };

  // Calculate cart total
  const subtotal = cartItems.reduce(
    (sum, i) => sum + Number(i.product.sellingPrice) * i.quantity,
    0
  );
  const totalDiscount = cartItems.reduce((sum, i) => sum + i.discount * i.quantity, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // Complete checkout
  const handleConfirmCheckout = async ({
    paymentMethod,
    amountTendered,
    changeDue,
    notes,
  }: {
    paymentMethod: PaymentMethod;
    amountTendered?: number;
    changeDue?: number;
    notes?: string;
  }) => {
    if (cartItems.length === 0) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const sale = await api.createSale({
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount,
        })),
        paymentMethod,
        notes,
        idempotencyKey: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      });

      // Transaction saved
      setCompletedSale(sale);
      setTenderedInfo({ amountTendered, changeDue });
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);

      // Reset cart
      setCartItems([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete sale. Please verify inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setCompletedSale(null);
    setTenderedInfo({});
    // Refocus barcode scanner
    setTimeout(() => {
      const input = document.getElementById('pos-barcode-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)] max-h-[860px]">
        {/* LEFT COLUMN: Barcode Scanner & Product Search */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto thin-scroll pr-1">
          {/* Terminal Banner */}
          <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border-2 border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  POS Checkout Terminal
                </h1>
                <p className="text-xs text-slate-500">
                  Cashier: <strong className="text-slate-800">{user?.name || 'Cashier'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentDateString}</span>
            </div>
          </div>

          {/* Toast / Error alerts */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium flex-1">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-500 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successToast && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {/* 1. Barcode Scanner Component */}
          <BarcodeScannerInput
            onProductScanned={handleAddProduct}
            onError={(msg) => setErrorMessage(msg)}
            onSuccessMessage={(msg) => setSuccessToast(msg)}
          />

          {/* 2. Manual Product Search Fallback */}
          <div className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-2xs p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Manual Product Search
              </span>
              <span className="text-[11px] text-slate-400">
                Fallback when barcode is absent or damaged
              </span>
            </div>
            <ProductSearch
              onSelectProduct={handleAddProduct}
              onError={(msg) => setErrorMessage(msg)}
            />
          </div>

          {/* Quick instructions / Retail hardware tips */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 text-xs space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Retail Hardware Ready</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Plug any standard USB barcode scanner into your computer. It reads barcodes in real-time, adds items, and increments quantities. Print receipts via thermal 58mm / 80mm printers.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: POS Cart */}
        <POSCart
          cartItems={cartItems}
          onUpdateQty={handleUpdateQty}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          loading={loading}
        />
      </div>

      {/* Checkout Modal */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        cartItems={cartItems}
        totalAmount={grandTotal}
        loading={loading}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={handleConfirmCheckout}
      />

      {/* Receipt Modal (Thermal 58mm / 80mm Printable) */}
      <ReceiptPreview
        isOpen={isReceiptOpen}
        sale={completedSale}
        onClose={handleCloseReceipt}
        amountTendered={tenderedInfo.amountTendered}
        changeDue={tenderedInfo.changeDue}
      />
    </div>
  );
}
