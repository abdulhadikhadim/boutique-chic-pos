// API configuration and base client
const API_BASE_URL = 'http://localhost:8001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
    };

    // Only add JSON headers if we're not sending FormData
    if (!(options.body instanceof FormData)) {
      config.headers = {
        ...this.getHeaders(),
        ...options.headers,
      };
    } else {
      // For FormData, only add auth header, let browser set Content-Type
      config.headers = {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        ...options.headers,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<{access_token: string, token_type: string}> {
    const response = await this.request<{access_token: string, token_type: string}>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = response.access_token;
    localStorage.setItem('access_token', response.access_token);
    
    return response;
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/auth/me');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  // Product methods
  async getProducts(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
    if (params?.category) queryParams.set('category', params.category);
    if (params?.search) queryParams.set('search', params.search);

    const endpoint = `/products/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getProduct(id: string): Promise<any> {
    return this.request(`/products/${id}`);
  }

  async createProduct(product: any): Promise<any> {
    return this.request('/products/', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: any): Promise<any> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<any> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadProductImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/products/upload-image/', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    });
  }

  async getLowStockProducts(threshold: number = 10): Promise<any> {
    return this.request(`/products/low-stock/?threshold=${threshold}`);
  }

  async getOutOfStockProducts(): Promise<any> {
    return this.request('/products/out-of-stock/');
  }

  async getCategories(): Promise<any> {
    return this.request('/products/categories/');
  }

  // Customer methods
  async getCustomers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);

    const endpoint = `/customers/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getCustomer(id: string): Promise<any> {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(customer: any): Promise<any> {
    return this.request('/customers/', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, customer: any): Promise<any> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string): Promise<any> {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async updateCustomerLoyalty(id: string, points: number): Promise<any> {
    return this.request(`/customers/${id}/loyalty?points=${points}`, {
      method: 'PUT',
    });
  }

  async getTopLoyaltyCustomers(limit: number = 10): Promise<any> {
    return this.request(`/customers/loyalty/top/?limit=${limit}`);
  }

  // Sales methods
  async getSales(params?: {
    skip?: number;
    limit?: number;
    cashier_id?: string;
    customer_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
    if (params?.cashier_id) queryParams.set('cashier_id', params.cashier_id);
    if (params?.customer_id) queryParams.set('customer_id', params.customer_id);
    if (params?.start_date) queryParams.set('start_date', params.start_date);
    if (params?.end_date) queryParams.set('end_date', params.end_date);

    const endpoint = `/sales/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getSale(id: string): Promise<any> {
    return this.request(`/sales/${id}`);
  }

  async createSale(sale: any): Promise<any> {
    return this.request('/sales/', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, sale: any): Promise<any> {
    return this.request(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
  }

  async getSalesAnalytics(days: number = 30): Promise<any> {
    return this.request(`/sales/analytics/dashboard?days=${days}`);
  }

  async getDailyReport(date: string): Promise<any> {
    return this.request(`/sales/reports/daily?date=${date}`);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  description: string;
  image: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  alternate_phone?: string;
  loyalty_points: number;
  total_spent: number;
  visits: number;
  last_visit?: string;
  preferences?: {
    size?: string;
    style?: string[];
  };
  name?: string; // Computed property for backward compatibility
}

export interface SaleItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  product_name?: string;
}

export interface Sale {
  id: string;
  customer_id?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment';
  cashier_id: string;
  timestamp?: string;
  status: 'completed' | 'partial_payment' | 'refunded' | 'partial_refund' | 'cancelled';
  paid_amount?: number;
  remaining_amount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'manager' | 'owner';
  permissions: string[];
  is_active: boolean;
}

export default apiClient;