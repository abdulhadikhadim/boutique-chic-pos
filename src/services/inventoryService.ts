import { Product, ProductVariant } from '@/data/mockData';

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  averagePrice: number;
  totalCost: number;
  potentialProfit: number;
  categoryBreakdown: Record<string, number>;
}

export interface InventoryFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
  searchTerm?: string;
}

export class InventoryService {
  private static STORAGE_KEY = 'boutique-inventory';

  // Load inventory from localStorage
  static loadInventory(): Product[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading inventory:', error);
      return [];
    }
  }

  // Save inventory to localStorage
  static saveInventory(products: Product[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving inventory:', error);
      throw new Error('Failed to save inventory data');
    }
  }

  // Generate unique SKU
  static generateSKU(name: string, category: string): string {
    const namePrefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const categoryPrefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const timestamp = Date.now().toString().slice(-4);
    return `${categoryPrefix}-${namePrefix}-${timestamp}`;
  }

  // Validate product data
  static validateProduct(product: Partial<Product>): string[] {
    const errors: string[] = [];

    if (!product.name?.trim()) {
      errors.push('Product name is required');
    }

    if (!product.sku?.trim()) {
      errors.push('SKU is required');
    }

    if (product.price === undefined || product.price < 0) {
      errors.push('Valid price is required');
    }

    if (product.cost === undefined || product.cost < 0) {
      errors.push('Valid cost is required');
    }

    if (product.stock === undefined || product.stock < 0) {
      errors.push('Valid stock quantity is required');
    }

    if (product.price && product.cost && product.price < product.cost) {
      errors.push('Price should be greater than or equal to cost');
    }

    return errors;
  }

  // Calculate inventory statistics
  static calculateStats(products: Product[]): InventoryStats {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;
    const potentialProfit = totalValue - totalCost;

    const categoryBreakdown = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      averagePrice,
      totalCost,
      potentialProfit,
      categoryBreakdown
    };
  }

  // Filter products based on criteria
  static filterProducts(products: Product[], filters: InventoryFilters): Product[] {
    return products.filter(product => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Price range filter
      if (filters.priceMin !== undefined && product.price < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== undefined && product.price > filters.priceMax) {
        return false;
      }

      // Stock range filter
      if (filters.stockMin !== undefined && product.stock < filters.stockMin) {
        return false;
      }
      if (filters.stockMax !== undefined && product.stock > filters.stockMax) {
        return false;
      }

      return true;
    });
  }

  // Export to CSV format
  static exportToCSV(products: Product[]): string {
    const headers = [
      'ID', 'Name', 'Category', 'Price', 'Cost', 'Stock', 'SKU', 'Description'
    ];

    const rows = products.map(product => [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      product.category,
      product.price.toFixed(2),
      product.cost.toFixed(2),
      product.stock,
      product.sku,
      `"${product.description.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Import from CSV format
  static importFromCSV(csvContent: string): Product[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one product');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const products: Product[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        
        if (values.length < 8) {
          errors.push(`Line ${i + 1}: Insufficient data`);
          continue;
        }

        const product: Product = {
          id: values[0] || `imported_${Date.now()}_${i}`,
          name: this.cleanCSVValue(values[1]),
          category: values[2] || 'Uncategorized',
          price: parseFloat(values[3]) || 0,
          cost: parseFloat(values[4]) || 0,
          stock: parseInt(values[5]) || 0,
          sku: values[6] || this.generateSKU(this.cleanCSVValue(values[1]), values[2] || 'Uncategorized'),
          description: this.cleanCSVValue(values[7]),
          image: '/api/placeholder/300/400',
          variants: []
        };

        const validationErrors = this.validateProduct(product);
        if (validationErrors.length > 0) {
          errors.push(`Line ${i + 1}: ${validationErrors.join(', ')}`);
          continue;
        }

        products.push(product);
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('CSV Import Warnings:', errors);
    }

    return products;
  }

  // Helper method to parse CSV line with proper quote handling
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current); // Add last field
    return result;
  }

  // Helper method to clean CSV values
  private static cleanCSVValue(value: string): string {
    return value.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim();
  }

  // Download CSV file
  static downloadCSV(products: Product[], filename?: string): void {
    const csvContent = this.exportToCSV(products);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `inventory_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Bulk update stock levels
  static bulkUpdateStock(products: Product[], updates: Record<string, number>): Product[] {
    return products.map(product => {
      if (updates[product.id] !== undefined) {
        return {
          ...product,
          stock: Math.max(0, updates[product.id])
        };
      }
      return product;
    });
  }

  // Get products by category
  static getProductsByCategory(products: Product[]): Record<string, Product[]> {
    return products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }

  // Get low stock products
  static getLowStockProducts(products: Product[], threshold = 10): Product[] {
    return products.filter(product => product.stock > 0 && product.stock <= threshold);
  }

  // Get out of stock products
  static getOutOfStockProducts(products: Product[]): Product[] {
    return products.filter(product => product.stock === 0);
  }

  // Calculate profit margin for a product
  static calculateProfitMargin(product: Product): number {
    if (product.price === 0) return 0;
    return ((product.price - product.cost) / product.price) * 100;
  }

  // Get top selling products (mock data - in real app this would come from sales data)
  static getTopSellingProducts(products: Product[], limit = 5): Product[] {
    // Mock implementation - sorts by lowest stock (assuming higher sales)
    return products
      .filter(p => p.stock < 50) // Products that have been sold
      .sort((a, b) => a.stock - b.stock)
      .slice(0, limit);
  }

  // Generate reorder suggestions
  static getReorderSuggestions(products: Product[], salesData?: any[]): Product[] {
    // Simple reorder logic - products with stock < 10
    return products.filter(product => product.stock < 10);
  }
}

export default InventoryService;