'use client';

import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '@/lib/types';
import { CartLine } from './CartItem';
import {
  X, CheckCircle2, Banknote, CreditCard, Building2, Layers,
  AlertCircle, ArrowRight, Wallet, Calculator
} from 'lucide-react';

interface CheckoutDialogProps {
  isOpen: boolean;
  cartItems: CartLine[];
  totalAmount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (paymentDetails: {
    paymentMethod: PaymentMethod;
    amountTendered?: number;
    changeDue?: number;
    notes?: string;
  }) => void;
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CheckoutDialog({
  isOpen,
  cartItems,
  totalAmount,
  loading,
  onClose,
  onConfirm,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Default tendered to exact total when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountTendered(String(totalAmount));
      setValidationError('');
      setNotes('');
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);
  const isCash = paymentMethod === 'CASH';
  const isSplit = paymentMethod === 'SPLIT';

  // Quick cash buttons
  const quickCashPresets = [
    { label: 'Exact', value: totalAmount },
    { label: '₦1,000', value: 1000 },
    { label: '₦2,000', value: 2000 },
    { label: '₦5,000', value: 5000 },
    { label: '₦10,000', value: 10000 },
    { label: '₦20,000', value: 20000 },
  ].filter((p) => p.value >= totalAmount || p.label === 'Exact');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (isCash && tenderedNum < totalAmount) {
      setValidationError(`Amount tendered (${fmt(tenderedNum)}) is less than total payable (${fmt(totalAmount)})`);
      return;
    }

    onConfirm({
      paymentMethod,
      amountTendered: isCash ? tenderedNum : totalAmount,
      changeDue: isCash ? changeDue : 0,
      notes: notes.trim() || undefined,
    });
  };

  const pmOptions: { value: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'CASH', label: 'Cash', icon: <Banknote className="w-5 h-5 text-emerald-600" />, desc: 'Physical currency & change' },
    { value: 'POS_CARD', label: 'POS / Card', icon: <CreditCard className="w-5 h-5 text-blue-600" />, desc: 'Debit / Credit card swipe' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Building2 className="w-5 h-5 text-purple-600" />, desc: 'Instant bank payment' },
    { value: 'SPLIT', label: 'Split Payment', icon: <Layers className="w-5 h-5 text-amber-600" />, desc: 'Multiple methods' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Complete Checkout</h2>
              <p className="text-xs text-slate-400">{cartItems.length} items in cart</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Total Display Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                Total Payable
              </span>
              <span className="text-xs text-slate-500">Includes all discounts</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 tracking-tight">
              {fmt(totalAmount)}
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {pmOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`checkout-pm-${opt.value.toLowerCase()}`}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === opt.value
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {opt.icon}
                    <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Payment Details */}
          {isCash && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-slate-500" /> Amount Tendered (₦)
                </label>
                <span className="text-xs text-slate-500">Cash received from customer</span>
              </div>

              <input
                type="number"
                step="0.01"
                min={0}
                required
                id="pos-amount-tendered"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="Enter amount given"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Quick Cash Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 mr-1">Quick:</span>
                {quickCashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAmountTendered(String(preset.value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Change Due Display */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Change Due to Customer:
                </span>
                <span
                  className={`text-lg font-black font-mono ${
                    tenderedNum >= totalAmount ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {fmt(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Order Notes / Customer Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. POS ref #49281, regular customer, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3 px-5 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-checkout-btn"
              disabled={loading || (isCash && tenderedNum < totalAmount)}
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording Sale…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Process Sale · {fmt(totalAmount)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
