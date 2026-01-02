const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:1581';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  original_price?: number;
  stock?: number;
  sold?: number;
  total_revenue?: number;
  image_url?: string;
  image_urls?: string[];
  status?: string;
  size?: string[];
  created_at?: string;
  updated_at?: string;
  size_chart_template_id?: number;
  size_stocks?: Array<{
    row_id: number;
    size_label: string;
    stock: number;
  }>;
}

export interface Order {
  id: string;
  order_number?: string;
  customer?: string;
  email?: string;
  date?: string;
  created_at?: string;
  status: string;
  total: number;
  items_count?: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  new_customers: number;
  total_products: number;
  low_stock_count: number;
  pending_orders: number;
  completed_orders: number;
  failed_orders: number;
  returned_orders: number;
}

export interface SalesData {
  name: string;
  revenue: number;
}

export interface BestSellingProduct {
  id: string;
  name: string;
  sales: number;
  stock: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category?: string;
}

export interface StockCategory {
  category: string;
  total_items: number;
  low_stock: number;
  out_of_stock: number;
  value: number;
}

export interface OutOfStockProduct {
  id: string;
  name: string;
  category: string;
  last_order_date?: string;
}

export interface Customer {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  customer_type?: string;
  created_at?: string;
  joinDate?: string;
  orders_count?: number;
  total_spent?: number;
}

export interface Discount {
  id: string;
  code: string;
  discount: number;
  type: string;
  usage_count?: number;
  usage_limit?: number;
  min_order_value?: number;
  expiration_date?: string;
  expirationDate?: string;
  status?: string;
}

export interface SizeChartTemplate {
  id: number;
  name: string;
  category?: string;
  columns?: SizeChartColumn[];
  rows?: SizeChartRow[];
  values?: SizeChartValue[];
}

export interface SizeChartRow {
  id: number;
  template_id: number;
  size_label: string;
}

export interface SizeChartColumn {
  id: number;
  template_id: number;
  column_key: string;
  display_name: string;
  unit: string;
}

export interface SizeChartValue {
  id?: number;
  row_id: number;
  column_id: number;
  value: string;
}

// Helper function
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Dashboard APIs
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return fetchApi<DashboardStats>('/api/admin/dashboard/stats');
}

export async function getSalesData(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<SalesData[]>> {
  return fetchApi<SalesData[]>(`/api/admin/dashboard/sales?period=${period}`);
}

export async function getBestSellingProducts(limit: number = 5): Promise<ApiResponse<BestSellingProduct[]>> {
  return fetchApi<BestSellingProduct[]>(`/api/admin/dashboard/best-selling?limit=${limit}`);
}

export async function getLowStockItems(limit: number = 10): Promise<ApiResponse<LowStockItem[]>> {
  return fetchApi<LowStockItem[]>(`/api/admin/dashboard/low-stock?limit=${limit}`);
}

// Products APIs
export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}): Promise<ApiResponse<Product[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category) searchParams.set('category', params.category);
  
  return fetchApi<Product[]>(`/api/admin/products?${searchParams.toString()}`);
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  return fetchApi<Product>(`/api/admin/products/${id}`);
}

export async function createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
  return fetchApi<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<ApiResponse<Product>> {
  return fetchApi<Product>(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}

// Orders APIs
export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ApiResponse<Order[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  
  return fetchApi<Order[]>(`/api/admin/orders?${searchParams.toString()}`);
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return fetchApi<Order>(`/api/admin/orders/${id}`);
}

export async function getOrderStats(): Promise<ApiResponse<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  returned: number;
}>> {
  return fetchApi('/api/admin/orders/stats');
}

export async function updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
  return fetchApi<Order>(`/api/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// Customers APIs
export async function getCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  customer_type?: string;
}): Promise<ApiResponse<Customer[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.customer_type) searchParams.set('customer_type', params.customer_type);
  
  return fetchApi<Customer[]>(`/api/admin/customers?${searchParams.toString()}`);
}

export async function getCustomerStats(): Promise<ApiResponse<{
  total: number;
  active: number;
  new_this_month: number;
  total_revenue: number;
}>> {
  return fetchApi('/api/admin/customers/stats');
}

// Discounts APIs
export async function getDiscounts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<Discount[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  
  return fetchApi<Discount[]>(`/api/admin/discounts?${searchParams.toString()}`);
}

export async function getDiscountStats(): Promise<ApiResponse<{
  active: number;
  total_uses: number;
  discount_value_given: number;
}>> {
  return fetchApi('/api/admin/discounts/stats');
}

export async function createDiscount(discount: Partial<Discount>): Promise<ApiResponse<Discount>> {
  return fetchApi<Discount>('/api/admin/discounts', {
    method: 'POST',
    body: JSON.stringify(discount),
  });
}

export async function updateDiscount(id: string, discount: Partial<Discount>): Promise<ApiResponse<Discount>> {
  return fetchApi<Discount>(`/api/admin/discounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(discount),
  });
}

export async function deleteDiscount(id: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/admin/discounts/${id}`, {
    method: 'DELETE',
  });
}

// Stock APIs
export async function getStockOverview(): Promise<ApiResponse<StockCategory[]>> {
  return fetchApi<StockCategory[]>('/api/admin/stock/overview');
}

export async function getLowStockProducts(): Promise<ApiResponse<LowStockItem[]>> {
  return fetchApi<LowStockItem[]>('/api/admin/dashboard/low-stock?limit=100');
}

export async function getOutOfStockProducts(): Promise<ApiResponse<OutOfStockProduct[]>> {
  return fetchApi<OutOfStockProduct[]>('/api/admin/stock/out-of-stock');
}

// Size Chart APIs
export async function getSizeChartTemplates(): Promise<ApiResponse<SizeChartTemplate[]>> {
  return fetchApi<SizeChartTemplate[]>('/api/admin/size-charts/templates');
}

export async function getSizeChartTemplate(id: number): Promise<ApiResponse<SizeChartTemplate>> {
  return fetchApi<SizeChartTemplate>(`/api/admin/size-charts/templates/${id}`);
}

export async function createSizeChartTemplate(template: Partial<SizeChartTemplate>): Promise<ApiResponse<SizeChartTemplate>> {
  return fetchApi<SizeChartTemplate>('/api/admin/size-charts/templates', {
    method: 'POST',
    body: JSON.stringify(template),
  });
}

export async function updateSizeChartTemplate(id: number, template: Partial<SizeChartTemplate>): Promise<ApiResponse<SizeChartTemplate>> {
  return fetchApi<SizeChartTemplate>(`/api/admin/size-charts/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(template),
  });
}

export async function deleteSizeChartTemplate(id: number): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/admin/size-charts/templates/${id}`, {
    method: 'DELETE',
  });
}

export async function addSizeChartRow(templateId: number, row: { size_label: string }): Promise<ApiResponse<SizeChartRow>> {
  return fetchApi<SizeChartRow>(`/api/admin/size-charts/templates/${templateId}/rows`, {
    method: 'POST',
    body: JSON.stringify(row),
  });
}

export async function addSizeChartColumn(templateId: number, column: { column_key: string; display_name: string; unit: string }): Promise<ApiResponse<SizeChartColumn>> {
  return fetchApi<SizeChartColumn>(`/api/admin/size-charts/templates/${templateId}/columns`, {
    method: 'POST',
    body: JSON.stringify(column),
  });
}

export async function deleteSizeChartRow(templateId: number, rowId: number): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/admin/size-charts/templates/${templateId}/rows/${rowId}`, {
    method: 'DELETE',
  });
}

export async function deleteSizeChartColumn(templateId: number, columnId: number): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/admin/size-charts/templates/${templateId}/columns/${columnId}`, {
    method: 'DELETE',
  });
}

export async function updateSizeChartValues(templateId: number, values: Array<{ row_id: number; column_id: number; value: string }>): Promise<ApiResponse<SizeChartValue[]>> {
  return fetchApi<SizeChartValue[]>(`/api/admin/size-charts/templates/${templateId}/values`, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
}
