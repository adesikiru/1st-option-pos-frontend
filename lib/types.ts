export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_OFFICER';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'POS_CARD' | 'SPLIT';

export type SaleStatus = 'COMPLETED' | 'VOIDED' | 'REFUNDED';

export type MovementType =
  | 'SALE'
  | 'INITIAL_STOCK'
  | 'PURCHASE_RECEIPT'
  | 'DAMAGE_EXPIRED'
  | 'MANUAL_ADJUSTMENT'
  | 'RETURN_REFUND';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    products: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  unitOfMeasurement: string;
  costPrice: number | string;
  sellingPrice: number | string;
  stockQuantity: number | string;
  minStockThreshold: number | string;
  supplierId?: string;
  supplier?: Supplier;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number | string;
  unitCost: number | string;
  unitPrice: number | string;
  discount: number | string;
  totalPrice: number | string;
}

export interface Payment {
  id: string;
  paymentMethod: PaymentMethod;
  amount: number | string;
  reference?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  subtotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  totalAmount: number | string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  items: SaleItem[];
  payments: Payment[];
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number | string;
  previousQty: number | string;
  newQty: number | string;
  movementType: MovementType;
  reference?: string;
  reason?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface StockReceiptItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number | string;
  unitCost: number | string;
  totalCost: number | string;
}

export interface StockReceipt {
  id: string;
  receiptNumber: string;
  supplierId?: string;
  supplier?: Supplier;
  userId: string;
  user?: User;
  totalCost: number | string;
  notes?: string;
  items: StockReceiptItem[];
  createdAt: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  status: 'PENDING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorsJson?: string;
  userId: string;
  createdAt: string;
}

export interface DashboardMetrics {
  todaySales: number;
  todayTransactions: number;
  salesByPaymentMethod: Record<string, number>;
  totalInStock: number;
  lowStockCount: number;
  recentSales: Sale[];
  topProducts: {
    productId: string;
    name: string;
    sku: string;
    quantitySold: number;
    revenue: number;
  }[];
  inventoryValuation: {
    totalItems: number;
    totalStockCost: number;
    totalStockRetailValue: number;
  };
}

export interface InventorySummaryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  department: string;
  vendor: string;
  onHandQty: number;
  costPrice: number;
  sellingPrice: number;
  extCost: number;
  extPrice: number;
  onOrder: number;
  minStockThreshold: number;
  unitOfMeasurement: string;
}

export interface InventorySummaryDepartment {
  department: string;
  onHandQty: number;
  extCost: number;
  extPrice: number;
  onOrder: number;
  margin: number;
  marginPercent: number;
  products: InventorySummaryItem[];
}

export interface InventorySummaryReport {
  departments: InventorySummaryDepartment[];
  totals: {
    totalProducts: number;
    totalOnHandQty: number;
    totalExtCost: number;
    totalExtPrice: number;
    totalOnOrder: number;
    totalMargin: number;
    overallMarginPercent: number;
  };
}

export interface ItemSummaryRow {
  productId: string;
  productName: string;
  sku: string;
  department: string;
  vendor: string;
  qtySold: number;
  extPrice: number;
  extCost: number;
  margin: number;
  marginPercent: number;
}

export interface ItemSummaryReport {
  dateFrom: string;
  dateTo: string;
  items: ItemSummaryRow[];
  totals: {
    totalQtySold: number;
    totalExtPrice: number;
    totalExtCost: number;
    totalMargin: number;
    overallMarginPercent: number;
  };
}

export interface ProductStatistics {
  product: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    description: string | null;
    department: string;
    categoryId?: string;
    vendor: string;
    supplierId?: string;
    unitOfMeasurement: string;
    onHandQty: number;
    unitCost: number;
    unitPrice: number;
    extCost: number;
    extPrice: number;
    minStockThreshold: number;
    isActive: boolean;
  };
  totals: {
    netSales: number;
    costOfGoods: number;
    profit: number;
    profitMargin: number;
    totalQtySold: number;
  };
  quantityIn: {
    received: number;
    salesReturns: number;
    adjustments: number;
    transfers: number;
    total: number;
  };
  quantityOut: {
    sold: number;
    vendorReturns: number;
    adjustments: number;
    transfers: number;
    total: number;
  };
  history: Array<{
    id: string;
    changeDate: string;
    type: MovementType;
    quantity: number;
    previousQty: number;
    onHandQuantity: number;
    reason: string;
    reference?: string;
    changedBy: string;
  }>;
}
