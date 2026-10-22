'use client';

import React from 'react';
import { Sale } from '@/lib/types';
import ReceiptPreview from './ReceiptPreview';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  isReprint?: boolean;
  amountTendered?: number;
  changeDue?: number;
}

export default function ReceiptModal({
  sale,
  isOpen,
  onClose,
  isReprint = false,
  amountTendered,
  changeDue,
}: ReceiptModalProps) {
  return (
    <ReceiptPreview
      isOpen={isOpen}
      sale={sale}
      onClose={onClose}
      isReprint={isReprint}
      amountTendered={amountTendered}
      changeDue={changeDue}
    />
  );
}
