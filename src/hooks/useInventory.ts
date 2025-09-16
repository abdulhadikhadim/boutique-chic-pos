import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/data/mockData';
import InventoryService from '@/services/inventoryService';
import { toast } from '@/hooks/use-toast';

export interface UseInventoryReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  importProducts: (csvContent: string) => Promise<void>;
  exportProducts: () => void;
  refreshProducts: () => void;
  stats: ReturnType<typeof InventoryService.calculateStats>;
}

export function useInventory(initialProducts?: Product[]): UseInventoryReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize products
  useEffect(() => {
    try {
      setLoading(true);
      let loadedProducts: Product[] = [];

      // Try to load from localStorage first
      const storedProducts = InventoryService.loadInventory();
      
      if (storedProducts.length > 0) {
        loadedProducts = storedProducts;
      } else if (initialProducts) {
        // Use initial products if no stored data
        loadedProducts = initialProducts;
        InventoryService.saveInventory(loadedProducts);
      }

      setProducts(loadedProducts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [initialProducts]);

  // Save products to storage whenever products change
  useEffect(() => {
    if (!loading && products.length >= 0) {
      try {
        InventoryService.saveInventory(products);
      } catch (err) {
        console.error('Error saving inventory:', err);
        toast({
          title: "Save Error",
          description: "Failed to save inventory changes",
          variant: "destructive"
        });
      }
    }
  }, [products, loading]);

  // Add new product
  const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      // Validate product data
      const validationErrors = InventoryService.validateProduct(productData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Check for duplicate SKU
      const existingSku = products.find(p => p.sku === productData.sku);
      if (existingSku) {
        throw new Error('SKU already exists');
      }

      const newProduct: Product = {
        ...productData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };

      setProducts(prev => [...prev, newProduct]);
      
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added to inventory`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add product';
      setError(errorMessage);
      toast({
        title: "Error Adding Product",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Update existing product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);

      const existingProduct = products.find(p => p.id === id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      const updatedProduct = { ...existingProduct, ...updates };

      // Validate updated product data
      const validationErrors = InventoryService.validateProduct(updatedProduct);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Check for duplicate SKU (excluding current product)
      if (updates.sku) {
        const existingSku = products.find(p => p.sku === updates.sku && p.id !== id);
        if (existingSku) {
          throw new Error('SKU already exists');
        }
      }

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      
      toast({
        title: "Product Updated",
        description: `${updatedProduct.name} has been updated`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      toast({
        title: "Error Updating Product",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Delete product
  const deleteProduct = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const productToDelete = products.find(p => p.id === id);
      if (!productToDelete) {
        throw new Error('Product not found');
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Product Deleted",
        description: `${productToDelete.name} has been removed from inventory`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      toast({
        title: "Error Deleting Product",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Import products from CSV
  const importProducts = useCallback(async (csvContent: string) => {
    try {
      setLoading(true);
      setError(null);

      const importedProducts = InventoryService.importFromCSV(csvContent);
      
      if (importedProducts.length === 0) {
        throw new Error('No valid products found in CSV file');
      }

      // Check for SKU conflicts
      const existingSKUs = new Set(products.map(p => p.sku));
      const conflictingSKUs = importedProducts.filter(p => existingSKUs.has(p.sku));
      
      if (conflictingSKUs.length > 0) {
        toast({
          title: "SKU Conflicts Detected",
          description: `${conflictingSKUs.length} products have conflicting SKUs and will be skipped`,
          variant: "destructive"
        });
      }

      // Filter out products with conflicting SKUs
      const validProducts = importedProducts.filter(p => !existingSKUs.has(p.sku));
      
      if (validProducts.length === 0) {
        throw new Error('All imported products have conflicting SKUs');
      }

      setProducts(prev => [...prev, ...validProducts]);
      
      toast({
        title: "Import Successful",
        description: `${validProducts.length} products imported successfully`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import products';
      setError(errorMessage);
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Export products to CSV
  const exportProducts = useCallback(() => {
    try {
      InventoryService.downloadCSV(products);
      toast({
        title: "Export Successful",
        description: "Inventory data exported to CSV file",
      });
    } catch (err) {
      toast({
        title: "Export Error",
        description: "Failed to export inventory data",
        variant: "destructive"
      });
    }
  }, [products]);

  // Refresh products from storage
  const refreshProducts = useCallback(() => {
    try {
      setLoading(true);
      const storedProducts = InventoryService.loadInventory();
      setProducts(storedProducts);
      setError(null);
      
      toast({
        title: "Inventory Refreshed",
        description: "Inventory data reloaded from storage",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh inventory';
      setError(errorMessage);
      toast({
        title: "Refresh Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate inventory statistics
  const stats = InventoryService.calculateStats(products);

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    exportProducts,
    refreshProducts,
    stats
  };
}