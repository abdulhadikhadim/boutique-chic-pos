import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { BillDialog } from './BillDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { apiClient, Product, Customer, Sale, SaleItem } from '@/services/apiClient';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign,
  User,
  UserPlus,
  Trash2,
  Package,
  Edit3,
  Receipt,
  Phone,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  variantId?: string;
  quantity: number;
  price: number; // Current price for this cart item (can be different from product.price)
  originalPrice: number; // Original product price
}

interface NewCustomerForm {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  alternate_phone: string;
}

export function CashierDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{index: number, price: string} | null>(null);
  const [showBill, setShowBill] = useState(false);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New customer form
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    gender: '',
    alternate_phone: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [productsResponse, customersResponse] = await Promise.all([
        apiClient.getProducts({ limit: 1000 }),
        apiClient.getCustomers({ limit: 1000 })
      ]);
      
      setProducts(productsResponse.data || []);
      
      // Add computed name property for backward compatibility
      const customersWithNames = (customersResponse.data || []).map((customer: Customer) => ({
        ...customer,
        name: `${customer.first_name} ${customer.last_name}`
      }));
      setCustomers(customersWithNames);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load products and customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product, variantId?: string) => {
    const existingItem = cart.find(item => 
      item.product.id === product.id && item.variantId === variantId
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id && item.variantId === variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        product, 
        variantId, 
        quantity: 1, 
        price: product.price,
        originalPrice: product.price
      }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    });
  };

  const updateQuantity = (productId: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => !(item.product.id === productId && item.variantId === variantId)));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId && item.variantId === variantId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const updateCartItemPrice = (index: number, newPrice: number) => {
    setCart(cart.map((item, i) => 
      i === index ? { ...item, price: newPrice } : item
    ));
  };

  const handlePriceEdit = (index: number, price: string) => {
    setEditingPrice({ index, price });
  };

  const savePriceEdit = () => {
    if (editingPrice) {
      const newPrice = parseFloat(editingPrice.price);
      if (!isNaN(newPrice) && newPrice > 0) {
        updateCartItemPrice(editingPrice.index, newPrice);
        toast({
          title: "Price Updated",
          description: "Item price has been updated",
        });
      } else {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive"
        });
      }
    }
    setEditingPrice(null);
  };

  const cancelPriceEdit = () => {
    setEditingPrice(null);
  };

  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in required fields (First Name, Last Name, Phone)",
          variant: "destructive"
        });
        return;
      }

      const customerData = {
        ...newCustomer,
        loyalty_points: 0,
        total_spent: 0,
        visits: 0
      };

      const response = await apiClient.createCustomer(customerData);
      const createdCustomer = response.data;
      
      // Add computed name property for backward compatibility
      createdCustomer.name = `${createdCustomer.first_name} ${createdCustomer.last_name}`;
      
      setCustomers([...customers, createdCustomer]);
      setSelectedCustomer(createdCustomer);
      setShowAddCustomer(false);
      
      // Reset form
      setNewCustomer({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: '',
        gender: '',
        alternate_phone: ''
      });
      
      toast({
        title: "Customer Added",
        description: `${createdCustomer.first_name} ${createdCustomer.last_name} has been added`,
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error Adding Customer",
        description: "Failed to add customer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    // Show the bill dialog for payment processing
    setShowBill(true);
  };

  const handleSaleComplete = () => {
    // Clear cart and reset state
    setCart([]);
    setSelectedCustomer(null);
    setShowBill(false);
    
    // Refresh products to get updated stock
    loadInitialData();
  };

if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading products and customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-muted/20">
      {/* Products Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-lg h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4 hover:shadow-elegant transition-shadow cursor-pointer border-0 bg-card">
              <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">${product.price}</span>
                  <Badge variant={product.stock === 0 ? "destructive" : product.stock < 10 ? "secondary" : "default"} className="text-xs">
                    {product.stock} in stock
                  </Badge>
                </div>
                
                <Button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full mt-2 h-8 text-xs"
                  size="sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({cart.length})
          </h2>
        </div>

        {/* Customer Selection */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
            className="w-full justify-start mb-2"
          >
            <User className="w-4 h-4 mr-2" />
            {selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : "Select Customer (Optional)"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowAddCustomer(true)}
            className="w-full justify-start"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Customer
          </Button>
          
          {showCustomerSearch && (
            <div className="mt-2 space-y-1 max-h-32 overflow-auto">
              {customers.map(customer => (
                <Button
                  key={customer.id}
                  variant="ghost"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerSearch(false);
                  }}
                  className="w-full justify-start text-sm"
                >
                  <div className="flex flex-col items-start">
                    <span>{customer.first_name} {customer.last_name}</span>
                    <span className="text-xs text-muted-foreground">{customer.phone}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto space-y-3 mb-6">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <Card key={index} className="p-3 border-0 bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {editingPrice && editingPrice.index === index ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({...editingPrice, price: e.target.value})}
                            className="w-16 h-6 text-xs"
                            step="0.01"
                          />
                          <Button size="sm" variant="ghost" onClick={savePriceEdit} className="p-1 h-6 w-6">
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelPriceEdit} className="p-1 h-6 w-6">
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePriceEdit(index, item.price.toString())}
                            className="p-1 h-5 w-5"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {item.price !== item.originalPrice && (
                        <span className="text-xs text-orange-600">(Modified)</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.product.id, item.variantId, 0)}
                    className="p-1 h-6 w-6"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.variantId, item.quantity - 1)}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.variantId, item.quantity + 1)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-semibold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (8%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="space-y-2 mt-4">
          <Button
            onClick={() => setShowBillPreview(true)}
            variant="outline"
            className="w-full"
            disabled={cart.length === 0}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Preview Bill
          </Button>
          <Button
            onClick={handleCheckout}
            className="w-full bg-primary hover:bg-primary-hover"
            disabled={cart.length === 0}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile for quick checkout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="Email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                placeholder="Full address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={newCustomer.gender} onValueChange={(value) => setNewCustomer({...newCustomer, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternate_phone">Alternate Phone</Label>
                <Input
                  id="alternate_phone"
                  value={newCustomer.alternate_phone}
                  onChange={(e) => setNewCustomer({...newCustomer, alternate_phone: e.target.value})}
                  placeholder="Alternate phone"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Bill Preview Dialog */}
      <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Bill Preview
            </DialogTitle>
            <DialogDescription>
              Review the bill details before processing payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold">Fashion Boutique</h2>
              <p className="text-sm text-muted-foreground">Bill Preview</p>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Customer Info */}
            {selectedCustomer && (
              <div className="space-y-2">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                  {selectedCustomer.address && <p><span className="font-medium">Address:</span> {selectedCustomer.address}</p>}
                  <p><span className="font-medium">Loyalty Points:</span> {selectedCustomer.loyalty_points}</p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <h3 className="font-semibold">Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Item</th>
                      <th className="text-center p-3">Qty</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.product.name}</td>
                        <td className="text-center p-3">{item.quantity}</td>
                        <td className="text-right p-3">${item.price.toFixed(2)}</td>
                        <td className="text-right p-3">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Method:</span>
                <span>To be selected</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Bill Preview</title>
                      <style>
                        body { font-family: 'Courier New', monospace; margin: 20px; line-height: 1.4; }
                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                        .customer-info { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 15px; }
                        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .items-table th, .items-table td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
                        .items-table th { font-weight: bold; }
                        .items-table th:last-child, .items-table td:last-child { text-align: right; }
                        .totals { margin: 20px 0; }
                        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
                        .total-line { border-top: 1px solid #000; margin-top: 8px; padding-top: 8px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 30px; border-top: 1px dashed #000; padding-top: 15px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>Fashion Boutique</h1>
                        <p>Bill Preview</p>
                        <p>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                      </div>
                      
                      ${selectedCustomer ? `
                      <div class="customer-info">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${selectedCustomer.first_name} ${selectedCustomer.last_name}</p>
                        <p><strong>Phone:</strong> ${selectedCustomer.phone}</p>
                        ${selectedCustomer.address ? `<p><strong>Address:</strong> ${selectedCustomer.address}</p>` : ''}
                        <p><strong>Loyalty Points:</strong> ${selectedCustomer.loyalty_points}</p>
                      </div>
                      ` : ''}
                      
                      <table class="items-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${cart.map(item => `
                            <tr>
                              <td>${item.product.name}</td>
                              <td style="text-align: center;">${item.quantity}</td>
                              <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                              <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      
                      <div class="totals">
                        <div class="totals-row">
                          <span>Subtotal:</span>
                          <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="totals-row">
                          <span>Tax (8%):</span>
                          <span>$${tax.toFixed(2)}</span>
                        </div>
                        <div class="totals-row total-line">
                          <span>TOTAL:</span>
                          <span>$${total.toFixed(2)}</span>
                        </div>
                        <div class="totals-row">
                          <span>Payment Method:</span>
                          <span>To be selected</span>
                        </div>
                      </div>
                      
                      <div class="footer">
                        <p>Thank you for shopping with us!</p>
                        <p>* This is a preview. Payment not yet processed.</p>
                      </div>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }}>
                <Receipt className="w-4 h-4 mr-2" />
                Print Preview
              </Button>
              <Button onClick={() => {
                setShowBillPreview(false);
                setShowBill(true);
              }}>
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Bill Dialog */}
      <BillDialog
        open={showBill}
        onOpenChange={setShowBill}
        cart={cart}
        customer={selectedCustomer}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onSaleComplete={handleSaleComplete}
      />
    </div>
  );
}