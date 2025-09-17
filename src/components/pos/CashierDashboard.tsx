import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockProducts, mockCustomers, Product, Customer } from '@/data/mockData';
import { useInventory } from '@/hooks/useInventory';
import { AddCustomerDialog } from './AddCustomerDialog';
import { BillDialog } from './BillDialog';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign,
  User,
  Gift,
  Trash2,
  Package,
  Receipt,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  variantId?: string;
  quantity: number;
  price: number;
}

export function CashierDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [editingPrice, setEditingPrice] = useState<{ index: number; price: string } | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');
  
  const { products, updateProduct } = useInventory(mockProducts);

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
      setCart([...cart, { product, variantId, quantity: 1, price: product.price }]);
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = async (paymentMethod: string) => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update stock levels for each item in cart
      for (const item of cart) {
        const product = products.find(p => p.id === item.product.id);
        if (product && product.stock >= item.quantity) {
          await updateProduct(product.id, {
            stock: product.stock - item.quantity
          });
        } else {
          toast({
            title: "Insufficient Stock",
            description: `Not enough stock for ${item.product.name}`,
            variant: "destructive"
          });
          return;
        }
      }

      // Update customer data if selected
      if (selectedCustomer) {
        setCustomers(customers.map(customer => 
          customer.id === selectedCustomer.id 
            ? { 
                ...customer, 
                totalSpent: customer.totalSpent + total,
                visits: customer.visits + 1,
                lastVisit: new Date().toISOString().split('T')[0]
              }
            : customer
        ));
      }

      setLastPaymentMethod(paymentMethod);
      setShowBill(true);
      
      toast({
        title: "Sale completed!",
        description: `Payment of $${total.toFixed(2)} processed via ${paymentMethod}`,
      });
      
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "Failed to complete the sale",
        variant: "destructive"
      });
    }
  };

  const handleBillClose = () => {
    setShowBill(false);
    setCart([]);
    setSelectedCustomer(null);
    setLastPaymentMethod('');
  };

  const addNewCustomer = (customer: Customer) => {
    setCustomers([...customers, customer]);
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
  };

  const startEditingPrice = (index: number, currentPrice: number) => {
    setEditingPrice({ index, price: currentPrice.toString() });
  };

  const saveEditedPrice = (index: number) => {
    if (editingPrice && editingPrice.price && !isNaN(Number(editingPrice.price))) {
      const newPrice = Number(editingPrice.price);
      if (newPrice > 0) {
        setCart(cart.map((item, i) => 
          i === index ? { ...item, price: newPrice } : item
        ));
      }
    }
    setEditingPrice(null);
  };

  const cancelEditingPrice = () => {
    setEditingPrice(null);
  };

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
                  <Badge variant="secondary" className="text-xs">
                    {product.stock} in stock
                  </Badge>
                </div>
                
                <Button
                  onClick={() => addToCart(product)}
                  className="w-full mt-2 h-8 text-xs"
                  size="sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add to Cart
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
            className="w-full justify-start"
          >
            <User className="w-4 h-4 mr-2" />
            {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Select Customer (Optional)"}
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
                  {customer.firstName} {customer.lastName} - {customer.loyaltyPoints}pts
                </Button>
              ))}
              <AddCustomerDialog onAddCustomer={addNewCustomer} />
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
                      {editingPrice?.index === index ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                            className="h-6 w-16 text-xs"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveEditedPrice(index)}
                            className="p-1 h-6 w-6"
                          >
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditingPrice}
                            className="p-1 h-6 w-6"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">${item.price.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingPrice(index, item.price)}
                            className="p-1 h-5 w-5"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
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
            onClick={() => handleCheckout('credit_card')}
            className="w-full bg-primary hover:bg-primary-hover"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pay by Card
          </Button>
          <Button
            onClick={() => handleCheckout('cash')}
            variant="outline"
            className="w-full"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Pay by Cash
          </Button>
          
          {cart.length > 0 && (
            <Button
              onClick={() => setShowBill(true)}
              variant="secondary"
              className="w-full"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Preview Bill
            </Button>
          )}
        </div>
        
        <BillDialog
          open={showBill}
          onOpenChange={handleBillClose}
          cart={cart}
          customer={selectedCustomer}
          subtotal={subtotal}
          tax={tax}
          total={total}
          paymentMethod={lastPaymentMethod || 'preview'}
        />
      </div>
    </div>
  );
}