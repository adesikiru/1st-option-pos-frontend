'use client';

import React from 'react';
import { Sale } from '@/lib/types';
import { Flame } from 'lucide-react';

export type ThermalPaperSize = '58mm' | '80mm';

interface ReceiptProps {
  sale: Sale;
  paperSize?: ThermalPaperSize;
  isReprint?: boolean;
  amountTendered?: number;
  changeDue?: number;
}

const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Receipt({
  sale,
  paperSize = '80mm',
  isReprint = false,
  amountTendered,
  changeDue,
}: ReceiptProps) {
  const formattedDate = new Date(sale.createdAt).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const is58 = paperSize === '58mm';

  return (
    <div
      id="printable-receipt"
      className={`receipt-content bg-white text-black font-mono mx-auto p-4 ${
        is58 ? 'max-w-[58mm] text-[10px]' : 'max-w-[80mm] text-xs'
      } border border-dashed border-slate-300 print:border-none print:p-0 print:m-0`}
      style={{ lineHeight: 1.35 }}
    >
      {/* Reprint Banner */}
      {isReprint && (
        <div className="text-center font-bold border-b border-black pb-1 mb-2 tracking-widest text-[11px] uppercase">
          *** REPRINT / DUPLICATE COPY ***
        </div>
      )}

      {/* Header / Branding */}
      <div className="text-center pb-3 border-b border-dashed border-black">
        <div className="font-extrabold text-sm tracking-wider uppercase">
          1st Option Energy Mart
        </div>
        <div className="text-[11px] font-semibold text-slate-800">
          Retail & Convenience Mart
        </div>
        <div className="text-[10px] text-slate-600 mt-0.5">
          Service Station & Supermart
        </div>
        <div className="text-[10px] text-slate-600">
          Tel: +234 (0) 800-1ST-OPTION
        </div>
        <div className="text-[9px] text-slate-500">
          VAT Reg: 10293847-0001
        </div>
      </div>

      {/* Metadata */}
      <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Receipt No:</span>
          <span className="font-bold">{sale.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date/Time:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span className="font-semibold">{sale.cashier?.name || 'Staff'}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment:</span>
          <span className="font-bold">{sale.paymentMethod.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-semibold">{sale.status}</span>
        </div>
        {sale.notes && (
          <div className="flex justify-between text-[10px] italic">
            <span>Notes:</span>
            <span>{sale.notes}</span>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="py-2.5 border-b border-dashed border-black">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black text-[10px] font-bold">
              <th className="pb-1 text-left">ITEM</th>
              <th className="pb-1 text-center">QTY</th>
              <th className="pb-1 text-right">PRICE</th>
              <th className="pb-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-200">
            {sale.items.map((item, index) => (
              <tr key={item.id || index} className="align-top">
                <td className="py-1 pr-1 font-semibold">
                  <div>{item.productName}</div>
                  <div className="text-[9px] text-slate-500 font-normal">
                    {item.sku}
                  </div>
                </td>
                <td className="py-1 text-center">{Number(item.quantity)}</td>
                <td className="py-1 text-right whitespace-nowrap">
                  {fmt(Number(item.unitPrice))}
                </td>
                <td className="py-1 text-right font-bold whitespace-nowrap">
                  {fmt(Number(item.totalPrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{fmt(Number(sale.subtotal))}</span>
        </div>

        {Number(sale.discountTotal) > 0 && (
          <div className="flex justify-between font-semibold">
            <span>Discount:</span>
            <span>-{fmt(Number(sale.discountTotal))}</span>
          </div>
        )}

        {Number(sale.taxTotal) > 0 && (
          <div className="flex justify-between">
            <span>Tax / VAT:</span>
            <span>{fmt(Number(sale.taxTotal))}</span>
          </div>
        )}

        <div className="flex justify-between font-black text-sm pt-1.5 border-t border-black">
          <span>TOTAL:</span>
          <span>{fmt(Number(sale.totalAmount))}</span>
        </div>

        {amountTendered !== undefined && (
          <div className="flex justify-between pt-1">
            <span>Amount Tendered:</span>
            <span>{fmt(amountTendered)}</span>
          </div>
        )}

        {changeDue !== undefined && (
          <div className="flex justify-between font-bold">
            <span>Change Due:</span>
            <span>{fmt(changeDue)}</span>
          </div>
        )}
      </div>

      {/* Footer / Barcode decoration */}
      <div className="text-center pt-3 text-[10px] space-y-1">
        <p className="font-bold">THANK YOU FOR YOUR PATRONAGE!</p>
        <p>Please retain receipt for exchange or enquiry.</p>
        <p className="text-[9px] text-slate-600">Goods returned must be accompanied by receipt within 24 hours.</p>

        {/* Monospace barcode simulation for thermal printers */}
        <div className="py-2 text-center">
          <div className="font-mono text-xs tracking-widest font-black inline-block px-2 py-0.5 border border-black">
            *{sale.receiptNumber}*
          </div>
        </div>

        <p className="text-[9px] text-slate-500">1st Option POS • Fast Retail Checkout</p>
      </div>
    </div>
  );
}
