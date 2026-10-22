'use client';

import React, { useState } from 'react';
import { Sale } from '@/lib/types';
import Receipt, { ThermalPaperSize } from './Receipt';
import PrintReceiptButton from './PrintReceiptButton';
import { X, CheckCircle, Receipt as ReceiptIcon, Printer, FileText } from 'lucide-react';

interface ReceiptPreviewProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  isReprint?: boolean;
  amountTendered?: number;
  changeDue?: number;
}

export default function ReceiptPreview({
  isOpen,
  sale,
  onClose,
  isReprint = false,
  amountTendered,
  changeDue,
}: ReceiptPreviewProps) {
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>('80mm');

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {isReprint ? 'Reprint Receipt' : 'Transaction Receipt'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">{sale.receiptNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper size toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  paperSize === '58mm'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  paperSize === '80mm'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto p-6 flex-1 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible flex justify-center">
          <div className="shadow-sm rounded-xl overflow-hidden bg-white print:shadow-none">
            <Receipt
              sale={sale}
              paperSize={paperSize}
              isReprint={isReprint}
              amountTendered={amountTendered}
              changeDue={changeDue}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-500 hidden sm:block">
            Format: <strong className="text-slate-800">{paperSize} thermal roll</strong>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <PrintReceiptButton
              size="md"
              label={isReprint ? 'Print Duplicate' : 'Print Receipt'}
              className="flex-1 sm:flex-initial"
            />
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
