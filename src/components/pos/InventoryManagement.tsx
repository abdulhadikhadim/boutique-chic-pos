import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product, ProductVariant } from '@/data/mockData';
import { apiClient } from '@/services/apiClient';
import { 
  Plus, 
  Package, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NewProductForm {
  name: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  sku: string;
  description: string;
  image: string;
  variants: ProductVariant[];
}

interface InventoryManagementProps {
  products?: Product[];
  onUpdateProducts?: (products: Product[]) => void;
}

export function InventoryManagement({ products: propProducts, onUpdateProducts }: InventoryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(propProducts || []);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    sku: '',
    description: '',
    image: '',
    variants: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load products from API
  useEffect(() => {
    if (propProducts) {
      setProducts(propProducts);
      setLoading(false);
    } else {
      loadProducts();
    }
  }, [propProducts]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts({ limit: 1000 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error Loading Products",
        description: "Failed to load products from server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Saree', 'Suit', 'Frock', 'Dupatta', 'Laces', 'Only Fabric'];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock < 10);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      const response = await apiClient.uploadProductImage(file);
      
      setNewProduct(prev => ({
        ...prev,
        image: response.data.image
      }));
      
      toast({
        title: "Image Uploaded",
        description: "Product image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.cost || !newProduct.stock || !newProduct.sku) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate SKU in existing products
    const existingProduct = products.find(p => p.sku.toLowerCase() === newProduct.sku.toLowerCase());
    if (existingProduct) {
      toast({
        title: "Duplicate SKU",
        description: "A product with this SKU already exists. Please use a different SKU.",
        variant: "destructive"
      });
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        category: newProduct.category || 'Uncategorized',
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost),
        stock: parseInt(newProduct.stock),
        sku: newProduct.sku,
        description: newProduct.description || '',
        image: newProduct.image || '/api/placeholder/300/400',
        variants: Array.isArray(newProduct.variants) ? newProduct.variants : []
      };

      const response = await apiClient.createProduct(productData);
      const createdProduct = response.data;
      
      // Update local state
      const updatedProducts = [...products, createdProduct];
      setProducts(updatedProducts);
      
      // Call callback if provided
      if (onUpdateProducts) {
        onUpdateProducts(updatedProducts);
      }
      
      setNewProduct({
        name: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        sku: '',
        description: '',
        image: '',
        variants: []
      });
      
      setShowAddForm(false);
      
      toast({
        title: "Product Added",
        description: `${createdProduct.name} has been added to inventory`,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product. Please try again.';
      
      // Handle specific error cases
      let displayMessage = errorMessage;
      if (errorMessage.includes('SKU already exists')) {
        displayMessage = 'A product with this SKU already exists. Please use a different SKU.';
      } else if (errorMessage.includes('Validation error')) {
        displayMessage = `Validation failed: ${errorMessage.replace('Validation error: ', '')}`;
      } else if (errorMessage.includes('HTTP 422')) {
        displayMessage = 'Please check all required fields are filled correctly.';
      }
      
      toast({
        title: "Error Adding Product",
        description: displayMessage,
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      sku: product.sku,
      description: product.description,
      image: product.image || '',
      variants: product.variants
    });
    setShowAddForm(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    // Check for duplicate SKU in other products (excluding current product)
    const existingProduct = products.find(p => 
      p.id !== editingProduct.id && 
      p.sku.toLowerCase() === newProduct.sku.toLowerCase()
    );
    if (existingProduct) {
      toast({
        title: "Duplicate SKU",
        description: "Another product with this SKU already exists. Please use a different SKU.",
        variant: "destructive"
      });
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        category: newProduct.category || 'Uncategorized',
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost),
        stock: parseInt(newProduct.stock),
        sku: newProduct.sku,
        description: newProduct.description || '',
        image: newProduct.image || editingProduct.image,
        variants: Array.isArray(newProduct.variants) ? newProduct.variants : []
      };

      const response = await apiClient.updateProduct(editingProduct.id, productData);
      const updatedProduct = response.data;
      
      // Update local state
      const updatedProducts = products.map(p => p.id === editingProduct.id ? updatedProduct : p);
      setProducts(updatedProducts);
      
      // Call callback if provided
      if (onUpdateProducts) {
        onUpdateProducts(updatedProducts);
      }
      
      setEditingProduct(null);
      setNewProduct({
        name: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        sku: '',
        description: '',
        image: '',
        variants: []
      });
      
      setShowAddForm(false);
      
      toast({
        title: "Product Updated",
        description: `${updatedProduct.name} has been updated`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product. Please try again.';
      
      // Handle specific error cases
      let displayMessage = errorMessage;
      if (errorMessage.includes('SKU already exists')) {
        displayMessage = 'Another product with this SKU already exists. Please use a different SKU.';
      } else if (errorMessage.includes('Validation error')) {
        displayMessage = `Validation failed: ${errorMessage.replace('Validation error: ', '')}`;
      } else if (errorMessage.includes('HTTP 422')) {
        displayMessage = 'Please check all required fields are filled correctly.';
      }
      
      toast({
        title: "Error Updating Product",
        description: displayMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await apiClient.deleteProduct(productId);
      
      // Update local state
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      
      // Call callback if provided
      if (onUpdateProducts) {
        onUpdateProducts(updatedProducts);
      }
      
      toast({
        title: "Product Deleted",
        description: "Product has been removed from inventory",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error Deleting Product",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Cost', 'Stock', 'SKU', 'Description'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        `"${product.name}"`,
        product.category,
        product.price,
        product.cost,
        product.stock,
        product.sku,
        `"${product.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Inventory data exported to CSV file",
    });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const importedProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 8) {
          importedProducts.push({
            id: values[0] || Date.now().toString() + i,
            name: values[1].replace(/"/g, ''),
            category: values[2],
            price: parseFloat(values[3]) || 0,
            cost: parseFloat(values[4]) || 0,
            stock: parseInt(values[5]) || 0,
            sku: values[6],
            description: values[7].replace(/"/g, ''),
            image: '/api/placeholder/300/400',
            variants: []
          });
        }
      }

      onUpdateProducts([...products, ...importedProducts]);
      
      toast({
        title: "Import Successful",
        description: `${importedProducts.length} products imported from CSV`,
      });
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <label htmlFor="csv-import">
            <Button variant="outline" asChild disabled={loading}>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </span>
            </Button>
          </label>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-3">
          {outOfStockProducts.length > 0 && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive mr-2" />
                <h3 className="font-semibold text-destructive">Out of Stock</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {outOfStockProducts.length} product(s) are out of stock: {outOfStockProducts.map(p => p.name).join(', ')}
              </p>
            </Card>
          )}
          {lowStockProducts.length > 0 && (
            <Card className="p-4 border-warning/50 bg-warning/5">
              <div className="flex items-center mb-2">
                <Info className="w-5 h-5 text-warning mr-2" />
                <h3 className="font-semibold text-warning">Low Stock Alert</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {lowStockProducts.length} product(s) have low stock (less than 10 units)
              </p>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">All Products</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Grid */}
          <div className="grid gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category} • SKU: {product.sku}</p>
                      <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">${product.price}</p>
                      <p className="text-sm text-muted-foreground">Cost: ${product.cost}</p>
                      <Badge variant={product.stock < 10 ? product.stock === 0 ? "destructive" : "secondary" : "default"}>
                        {product.stock} in stock
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="low-stock">
          <div className="grid gap-4">
            {lowStockProducts.map(product => (
              <Card key={product.id} className="p-4 border-warning/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category} • SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="text-warning border-warning">
                      {product.stock} left
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Restock
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="out-of-stock">
          <div className="grid gap-4">
            {outOfStockProducts.map(product => (
              <Card key={product.id} className="p-4 border-destructive/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category} • SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="destructive">Out of Stock</Badge>
                    <Button size="sm" onClick={() => handleEditProduct(product)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Restock Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the product information below.' : 'Fill in the details to add a new product to your inventory.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  placeholder="Enter SKU"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={newProduct.cost}
                  onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="product-image">Product Image</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                {newProduct.image ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <img
                        src={newProduct.image}
                        alt="Product preview"
                        className="max-w-32 max-h-32 object-cover rounded-lg border"
                      />
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewProduct({...newProduct, image: ''})}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {uploadingImage ? 'Uploading image...' : 'No image uploaded'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}