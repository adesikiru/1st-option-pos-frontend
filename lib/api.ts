import {
  Category,
  DashboardMetrics,
  ImportJob,
  PaymentMethod,
  Product,
  Sale,
  StockMovement,
  StockReceipt,
  Supplier,
  User,
} from './types';

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const API_BASE = rawApiBase.endsWith('/api/v1')
  ? rawApiBase
  : `${rawApiBase.replace(/\/$/, '')}/api/v1`;

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    setStoredToken(null);
    setStoredUser(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errData = await response.json();
      errorMsg = Array.isArray(errData.message)
        ? errData.message.join(', ')
        : errData.message || errorMsg;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const res = await request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.accessToken);
    setStoredUser(res.user);
    return res;
  },

  async getProfile(): Promise<User> {
    return request<User>('/auth/profile');
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Products
  async getProducts(params?: {
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.lowStock) query.set('lowStock', 'true');
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/products${queryString}`);
  },

  async getProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`);
  },

  async getProductBySku(sku: string): Promise<Product> {
    return request<Product>(`/products/sku/${encodeURIComponent(sku)}`);
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async getLowStockProducts(): Promise<Product[]> {
    return request<Product[]>('/products/low-stock');
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories');
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: { name?: string; description?: string }): Promise<Category> {
    return request<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Sales & POS
  async createSale(data: {
    items: { productId: string; quantity: number; discount?: number }[];
    paymentMethod: PaymentMethod;
    notes?: string;
    idempotencyKey?: string;
  }): Promise<Sale> {
    return request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSales(params?: {
    dateFrom?: string;
    dateTo?: string;
    cashierId?: string;
    receiptNumber?: string;
    paymentMethod?: PaymentMethod;
    page?: number;
    limit?: number;
  }): Promise<{ data: Sale[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.cashierId) query.set('cashierId', params.cashierId);
    if (params?.receiptNumber) query.set('receiptNumber', params.receiptNumber);
    if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/sales${queryString}`);
  },

  async getSale(id: string): Promise<Sale> {
    return request<Sale>(`/sales/${id}`);
  },

  async voidSale(id: string, reason: string): Promise<Sale> {
    return request<Sale>(`/sales/${id}/void`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // Inventory
  async adjustStock(data: {
    productId: string;
    quantity: number;
    type: 'DAMAGE_EXPIRED' | 'MANUAL_ADJUSTMENT' | 'INITIAL_STOCK';
    reason?: string;
  }): Promise<StockMovement> {
    return request<StockMovement>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMovements(params?: {
    productId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: StockMovement[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.productId) query.set('productId', params.productId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/inventory/movements${queryString}`);
  },

  // Suppliers & Receiving
  async getSuppliers(): Promise<Supplier[]> {
    return request<Supplier[]>('/suppliers');
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    return request<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return request<Supplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async receiveStock(data: {
    supplierId?: string;
    receiptNumber: string;
    notes?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
  }): Promise<StockReceipt> {
    return request<StockReceipt>('/suppliers/receive', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStockReceipts(): Promise<StockReceipt[]> {
    return request<StockReceipt[]>('/suppliers/receipts');
  },

  // Bulk Import
  async getImportTemplateUrl(): Promise<string> {
    return `${API_BASE}/imports/template`;
  },

  async importProductsCsv(csvContent: string, fileName?: string): Promise<{
    message: string;
    jobId: string;
    imported: number;
    failed: number;
    total: number;
    errors?: any[];
  }> {
    return request('/imports/products-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent, fileName }),
    });
  },

  async getImportHistory(): Promise<ImportJob[]> {
    return request<ImportJob[]>('/imports/history');
  },

  // Reports
  async getDashboard(): Promise<DashboardMetrics> {
    return request<DashboardMetrics>('/reports/dashboard');
  },

  async getSalesReport(dateFrom?: string, dateTo?: string): Promise<any> {
    const query = new URLSearchParams();
    if (dateFrom) query.set('dateFrom', dateFrom);
    if (dateTo) query.set('dateTo', dateTo);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/reports/sales${queryString}`);
  },

  async getInventoryReport(): Promise<any> {
    return request('/reports/inventory');
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async createUser(data: { email: string; name: string; password: string; role: string }): Promise<User> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateUser(id: string): Promise<User> {
    return request<User>(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async changeUserPassword(id: string, data: { currentPassword?: string; newPassword: string }): Promise<any> {
    return request(`/users/${id}/change-password`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
