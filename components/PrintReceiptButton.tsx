'use client';

import React from 'react';
import { Printer } from 'lucide-react';

interface PrintReceiptButtonProps {
  onPrint?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function PrintReceiptButton({
  onPrint,
  className = '',
  size = 'md',
  label = 'Print Receipt',
}: PrintReceiptButtonProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs gap-1.5',
    md: 'py-2.5 px-4 text-sm gap-2',
    lg: 'py-3.5 px-6 text-base gap-2.5',
  };

  return (
    <button
      type="button"
      id="print-receipt-btn"
      onClick={handlePrint}
      className={`flex items-center justify-center font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-95 cursor-pointer no-print ${sizeClasses[size]} ${className}`}
    >
      <Printer className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
