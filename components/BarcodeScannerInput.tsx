'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { soundManager } from '@/lib/sound';
import { ScanBarcode, Volume2, VolumeX, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface BarcodeScannerInputProps {
  onProductScanned: (product: Product) => void;
  onError: (message: string) => void;
  onSuccessMessage?: (message: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function BarcodeScannerInput({
  onProductScanned,
  onError,
  onSuccessMessage,
  autoFocus = true,
  disabled = false,
}: BarcodeScannerInputProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<{ code: string; time: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize sound preference
  useEffect(() => {
    setSoundEnabled(soundManager.isEnabled());
  }, []);

  // Auto-focus barcode input
  const focusInput = useCallback(() => {
    if (disabled) return;
    inputRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusInput();
    }
  }, [autoFocus, disabled, focusInput]);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundManager.setEnabled(next);
    setSoundEnabled(next);
  };

  const processBarcode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Duplicate scan prevention (within 600ms for the exact same barcode)
    const now = Date.now();
    if (lastScanned && lastScanned.code === code && now - lastScanned.time < 600) {
      return;
    }
    setLastScanned({ code, time: now });

    setScanning(true);
    try {
      const product = await api.getProductByBarcode(code);
      soundManager.playSuccess();
      onProductScanned(product);
      if (onSuccessMessage) {
        onSuccessMessage(`Added "${product.name}" (${product.sku})`);
      }
      setBarcodeInput('');
    } catch (err: any) {
      soundManager.playError();
      const msg = err.message || `No product found for barcode "${code}"`;
      onError(msg);
      setBarcodeInput('');
    } finally {
      setScanning(false);
      // Immediately restore focus for the next scan
      setTimeout(() => focusInput(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (barcodeInput.trim()) {
        processBarcode(barcodeInput);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm p-4 transition-all focus-within:border-emerald-500 focus-within:shadow-md">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ScanBarcode className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Barcode Scanner
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready to Scan
          </span>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          title={soundEnabled ? 'Scanner Beep: On (Click to Mute)' : 'Scanner Beep: Off (Click to Enable)'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
            soundEnabled
              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="text-[11px] hidden sm:inline">{soundEnabled ? 'Beep On' : 'Muted'}</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          {scanning ? (
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          ) : (
            <ScanBarcode className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          id="pos-barcode-input"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || scanning}
          placeholder="Scan barcode with USB scanner or type code and press Enter…"
          className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm placeholder:font-sans placeholder:text-slate-400 bg-slate-50/60 focus:bg-white transition-all disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
          {barcodeInput.trim() && (
            <button
              type="button"
              onClick={() => processBarcode(barcodeInput)}
              disabled={scanning}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              Enter
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
        <span>Scanners configured with &lt;Enter&gt; suffix will auto-add items to cart</span>
        <button
          type="button"
          onClick={focusInput}
          className="text-emerald-600 hover:underline font-medium text-[11px]"
        >
          Focus Scanner (F2)
        </button>
      </p>
    </div>
  );
}
