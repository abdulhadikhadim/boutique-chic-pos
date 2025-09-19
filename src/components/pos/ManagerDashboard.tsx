import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InventoryManagement } from './InventoryManagement';
import { apiClient, Customer, Product, Sale } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Clock,
  BarChart3,
  ShoppingCart,
  Calendar,
  Download,
  Plus,
  Edit,
  Phone,
  Mail,
  MapPin,
  Search,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface NewCustomerForm {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  alternate_phone: string;
}

export function ManagerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [inventorySearch, setInventorySearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
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
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [productsResponse, customersResponse, salesResponse] = await Promise.all([
        apiClient.getProducts({ limit: 1000 }),
        apiClient.getCustomers({ limit: 1000 }),
        apiClient.getSales({ limit: 1000 })
      ]);
      
      setProducts(productsResponse.data || []);
      
      // Add computed name property for backward compatibility
      const customersWithNames = (customersResponse.data || []).map((customer: Customer) => ({
        ...customer,
        name: `{customer.first_name} {customer.last_name}`
      }));
      setCustomers(customersWithNames);
      setSales(salesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load store data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentDialog = (customer: any) => {
    setSelectedCustomerForPayment(customer);
    setPaymentAmount(customer.totalOwed.toString());
    setShowPaymentDialog(true);
  };

  const handlePaymentSettlement = async () => {
    if (!selectedCustomerForPayment || !paymentAmount) {
      toast({
        title: "Invalid Payment",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedCustomerForPayment.totalOwed) {
      toast({
        title: "Invalid Amount",
        description: `Payment amount must be between 0.01 and {selectedCustomerForPayment.totalOwed.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the customer's outstanding sales
      const outstandingSales = sales.filter(sale => 
        sale.customer_id === selectedCustomerForPayment.id && 
        sale.status === 'partial_payment' &&
        (sale.remaining_amount || 0) > 0
      ).sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());

      let remainingPayment = amount;
      const updatedSales = [...sales];

      // Process payment against outstanding sales (oldest first)
      for (const sale of outstandingSales) {
        if (remainingPayment <= 0) break;

        const saleRemainingAmount = sale.remaining_amount || 0;
        const paymentForThisSale = Math.min(remainingPayment, saleRemainingAmount);
        
        const newRemainingAmount = saleRemainingAmount - paymentForThisSale;
        const newPaidAmount = (sale.paid_amount || 0) + paymentForThisSale;
        const newStatus = newRemainingAmount <= 0 ? 'completed' : 'partial_payment';

        // Update the sale
        const updatedSaleData = {
          ...sale,
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus
        };

        // Update in backend
        await apiClient.updateSale(sale.id, {
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus
        });

        // Update local state
        const saleIndex = updatedSales.findIndex(s => s.id === sale.id);
        if (saleIndex !== -1) {
          updatedSales[saleIndex] = updatedSaleData;
        }

        remainingPayment -= paymentForThisSale;
      }

      // Update customer's total spent
      const updatedCustomer = {
        ...selectedCustomerForPayment,
        total_spent: (selectedCustomerForPayment.total_spent || 0) + amount
      };

      await apiClient.updateCustomer(selectedCustomerForPayment.id, {
        total_spent: updatedCustomer.total_spent
      });

      // Update local states
      setSales(updatedSales);
      setCustomers(customers.map(c => 
        c.id === selectedCustomerForPayment.id ? updatedCustomer : c
      ));

      // Close dialog and reset
      setShowPaymentDialog(false);
      setSelectedCustomerForPayment(null);
      setPaymentAmount('');
      setPaymentMethod('cash');

      toast({
        title: "Payment Processed",
        description: `Successfully processed {amount.toFixed(2)} payment from {selectedCustomerForPayment.first_name} {selectedCustomerForPayment.last_name}`,
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.first_name || !newCustomer.last_name) {
        toast({
          title: "Missing Information",
          description: "Please fill in required fields (First Name, Last Name)",
          variant: "destructive"
        });
        return;
      }

      const customerData = {
        ...newCustomer,
        phone: newCustomer.phone || undefined, // Don't send empty string
        email: newCustomer.email || undefined,
        address: newCustomer.address || undefined,
        gender: newCustomer.gender || undefined,
        alternate_phone: newCustomer.alternate_phone || undefined,
        loyalty_points: 0,
        total_spent: 0,
        visits: 0
      };

      const response = await apiClient.createCustomer(customerData);
      const createdCustomer = response.data;
      
      // Add computed name property for backward compatibility
      createdCustomer.name = `{createdCustomer.first_name} {createdCustomer.last_name}`;
      
      setCustomers([...customers, createdCustomer]);
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
        description: `{createdCustomer.first_name} {createdCustomer.last_name} has been added`,
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

  // Filter functions
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    product.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const filteredSales = sales.filter(sale => {
    const saleId = sale.id?.toString().toLowerCase() || '';
    const customerName = sale.customer_id ? 
      customers.find(c => c.id === sale.customer_id)?.name?.toLowerCase() || '' : '';
    return saleId.includes(salesSearch.toLowerCase()) || customerName.includes(salesSearch.toLowerCase());
  });

  const filteredCustomers = customers.filter(customer =>
    customer.first_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.last_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Calculate metrics
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10);
  const totalCustomers = customers.length;

  // Calculate customers with outstanding balances
  const customersWithBalances = customers.map(customer => {
    const customerSales = sales.filter(sale => sale.customer_id === customer.id);
    const totalOwed = customerSales
      .filter(sale => sale.status === 'partial_payment')
      .reduce((sum, sale) => sum + (sale.remaining_amount || 0), 0);
    return {
      ...customer,
      totalOwed,
      hasOutstandingBalance: totalOwed > 0
    };
  });

  const customersWithOutstandingBalances = customersWithBalances.filter(c => c.hasOutstandingBalance);

  // Calculate dynamic sales performance
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const thisMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp || '');
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  }).reduce((sum, sale) => sum + (sale.total || 0), 0);

  const lastMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp || '');
    return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear;
  }).reduce((sum, sale) => sum + (sale.total || 0), 0);

  const salesGrowth = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100) : 0;

  // Calculate top categories dynamically
  const categoryStats = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { count: 0, totalValue: 0, totalSold: 0 };
    }
    acc[category].count += 1;
    acc[category].totalValue += product.price * product.stock;
    
    // Calculate sold items from sales data
    const productSalesInThisSale = sales.reduce((sold, sale) => {
      const productSalesInThisSale = sale.items?.filter(item => item.product_id === product.id) || [];
      return sold + productSalesInThisSale.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
    acc[category].totalSold += productSalesInThisSale;
    
    return acc;
  }, {} as Record<string, { count: number; totalValue: number; totalSold: number }>);

  const sortedCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.totalSold - a.totalSold)
    .slice(0, 5);

  const maxSold = Math.max(...Object.values(categoryStats).map(c => c.totalSold));

  // Get customers with outstanding balances with sales details
  const outstandingCustomersWithDetails = customersWithOutstandingBalances.map(customer => {
    const customerSales = sales.filter(sale => 
      sale.customer_id === customer.id && sale.status === 'partial_payment'
    );
    
    const latestSale = customerSales.sort((a, b) => 
      new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
    )[0];
    
    return {
      ...customer,
      latestSaleDate: latestSale?.timestamp ? new Date(latestSale.timestamp).toLocaleDateString() : 'N/A',
      latestSaleAmount: latestSale?.total || 0
    };
  }).sort((a, b) => b.totalOwed - a.totalOwed);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">Store operations and analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button variant="outline" size="sm">Export Report</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-0 bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
              <p className="text-2xl font-bold text-success">{totalSales.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            +12% from yesterday
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-primary">{totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            Last updated 1h ago
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-warning/10 to-warning/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-warning">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Needs attention
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customers</p>
              <p className="text-2xl font-bold text-accent-foreground">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-foreground" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            Active customers
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="manage-inventory">Manage Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Inventory Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 border-0 bg-gradient-to-br from-success/10 to-success/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-success">{products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </Card>
            
            <Card className="p-4 border-0 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-primary">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
            
            <Card className="p-4 border-0 bg-gradient-to-br from-warning/10 to-warning/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
                </div>
                <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </Card>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <Card className="p-4 border-warning/50 bg-warning/5">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-warning mr-2" />
                <h3 className="font-semibold text-warning">Low Stock Alert</h3>
              </div>
              <div className="space-y-2">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="text-warning border-warning">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Inventory Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Inventory Overview ({products.length} products)</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading inventory...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No products found</p>
                    <p className="text-sm">Try adjusting your search or add new products</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category} • SKU: {product.sku}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{product.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{product.price.toFixed(2)}</p>
                          <span className="text-xs text-muted-foreground">Cost: {product.cost.toFixed(2)}</span>
                        </div>
                        <Badge variant={product.stock < 10 ? product.stock === 0 ? "destructive" : "secondary" : "default"}>
                          {product.stock} in stock
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Profit: {((product.price - product.cost) * product.stock).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="manage-inventory" className="space-y-4">
          <InventoryManagement 
            products={products} 
            onUpdateProducts={() => loadAllData()}
          />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Sales ({sales.length} transactions)</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search sales..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading sales...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No sales found</p>
                    <p className="text-sm">Sales will appear here as they are made</p>
                  </div>
                ) : (
                  filteredSales.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()).map(sale => {
                    const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                    return (
                      <div key={sale.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-success" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Sale #{sale.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {sale.items?.length || 0} items • {sale.timestamp ? new Date(sale.timestamp).toLocaleString() : 'Unknown time'}
                            </p>
                            {customer && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Customer: {customer.first_name} {customer.last_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-success">{(sale.total || 0).toFixed(2)}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{sale.payment_method}</Badge>
                            <Badge 
                              variant={sale.status === 'completed' ? 'default' : 
                                     sale.status === 'partial_payment' ? 'secondary' : 'destructive'}
                            >
                              {sale.status === 'completed' ? 'Paid' : 
                               sale.status === 'partial_payment' ? 'Partial' : sale.status}
                            </Badge>
                          </div>
                          {sale.status === 'partial_payment' && sale.remaining_amount && (
                            <p className="text-xs text-orange-600">
                              Due: {sale.remaining_amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {/* Outstanding Balances Alert */}
          {customersWithOutstandingBalances.length > 0 && (
            <Card className="p-4 border-orange-200 bg-orange-50">
              <div className="flex items-center mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-orange-800">Outstanding Balances</h3>
              </div>
              <div className="space-y-2">
                {customersWithOutstandingBalances.slice(0, 3).map(customer => (
                  <div key={customer.id} className="flex items-center justify-between text-sm">
                    <span>{customer.first_name} {customer.last_name}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Owes: {customer.totalOwed.toFixed(2)}
                    </Badge>
                  </div>
                ))}
                {customersWithOutstandingBalances.length > 3 && (
                  <p className="text-xs text-orange-600 mt-2">
                    ... and {customersWithOutstandingBalances.length - 3} more customers with outstanding balances
                  </p>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customer Management ({customers.length} customers)</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={() => setShowAddCustomer(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading customers...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No customers found</p>
                    <p className="text-sm">{customerSearch ? 'Try adjusting your search' : 'Add your first customer to get started'}</p>
                  </div>
                ) : (
                  filteredCustomers.map(customer => {
                    const customerWithBalance = customersWithBalances.find(c => c.id === customer.id);
                    const outstandingBalance = customerWithBalance?.totalOwed || 0;
                    const hasOutstanding = outstandingBalance > 0;
                    
                    return (
                      <div key={customer.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors {
                        hasOutstanding ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' : 'bg-muted/50 hover:bg-muted/70'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center {
                            hasOutstanding ? 'bg-orange-100' : 'bg-primary/10'
                          }`}>
                            <Users className={`w-6 h-6 {
                              hasOutstanding ? 'text-orange-600' : 'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                              {customer.gender && (
                                <Badge variant="outline" className="text-xs">
                                  {customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1)}
                                </Badge>
                              )}
                              {hasOutstanding && (
                                <Badge variant="destructive" className="text-xs">
                                  Outstanding
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 mt-1">
                              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{customer.phone}</span>
                                </div>
                                {customer.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{customer.email}</span>
                                  </div>
                                )}
                              </div>
                              {customer.address && (
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{customer.address}</span>
                                </div>
                              )}
                              {customer.alternate_phone && (
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>Alt: {customer.alternate_phone}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{customer.visits || 0} visits</span>
                                <span>•</span>
                                <span>Last: {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1 min-w-32">
                          <div className="space-y-1">
                            <p className="font-semibold">{(customer.total_spent || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Total Spent</p>
                          </div>
                          {hasOutstanding && (
                            <div className="space-y-1">
                              <p className="font-semibold text-orange-600">{outstandingBalance.toFixed(2)}</p>
                              <p className="text-xs text-orange-600">Outstanding</p>
                            </div>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {customer.loyalty_points || 0} points
                          </Badge>
                          <div className="mt-2 flex space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sales Performance</h3>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Month</span>
                  <span className="font-semibold text-success">{thisMonthSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Month</span>
                  <span className="font-semibold">{lastMonthSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Growth</span>
                  <Badge className={`{
                    salesGrowth >= 0 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Sales Count</span>
                  <span className="font-semibold">{sales.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Order Value</span>
                  <span className="font-semibold">{sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Categories</h3>
                <Badge variant="secondary" className="text-xs">
                  By Items Sold
                </Badge>
              </div>
              <div className="space-y-3">
                {sortedCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sales data available
                  </p>
                ) : (
                  sortedCategories.map(([category, stats]) => {
                    const percentage = maxSold > 0 ? (stats.totalSold / maxSold * 100) : 0;
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{category}</span>
                            <span className="text-xs text-muted-foreground">
                              {stats.totalSold} sold • {stats.count} products
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-300" 
                                style={{ width: `{percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium min-w-10">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Outstanding Balances Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Customers with Outstanding Balances</h3>
                <p className="text-sm text-muted-foreground">
                  {outstandingCustomersWithDetails.length} customer(s) with pending payments
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" className="text-xs">
                  Total Outstanding: {customersWithOutstandingBalances.reduce((sum, c) => sum + c.totalOwed, 0).toFixed(2)}
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {outstandingCustomersWithDetails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No outstanding balances</p>
                <p className="text-sm">All customers have paid their bills in full</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead className="text-right">Outstanding Amount</TableHead>
                      <TableHead className="text-right">Latest Purchase Date</TableHead>
                      <TableHead className="text-right">Latest Purchase Amount</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingCustomersWithDetails.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div>
                              <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                              {customer.email && (
                                <p className="text-xs text-muted-foreground">{customer.email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.phone}</p>
                            {customer.alternate_phone && (
                              <p className="text-xs text-muted-foreground">Alt: {customer.alternate_phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <p className="font-semibold text-destructive">{customer.totalOwed.toFixed(2)}</p>
                            <Badge variant="destructive" className="text-xs mt-1">
                              Outstanding
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-medium">{customer.latestSaleDate}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-medium">{customer.latestSaleAmount.toFixed(2)}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2"
                              onClick={() => handleOpenPaymentDialog(customer)}
                            >
                              Settle
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="text-xs px-2 bg-success hover:bg-success/90"
                              onClick={() => {
                                setSelectedCustomerForPayment(customer);
                                setPaymentAmount(customer.totalOwed.toString());
                                handlePaymentSettlement();
                              }}
                            >
                              Pay Full
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment Settlement Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Outstanding Payment</DialogTitle>
            <DialogDescription>
              Process payment for customer's outstanding balance
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerForPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {selectedCustomerForPayment.first_name} {selectedCustomerForPayment.last_name}
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedCustomerForPayment.phone}</p>
                  {selectedCustomerForPayment.email && (
                    <p><span className="font-medium">Email:</span> {selectedCustomerForPayment.email}</p>
                  )}
                  <p><span className="font-medium">Total Outstanding:</span> 
                    <span className="text-destructive font-semibold ml-1">
                      {selectedCustomerForPayment.totalOwed.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_amount">Payment Amount *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCustomerForPayment.totalOwed}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                />
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPaymentAmount((selectedCustomerForPayment.totalOwed / 2).toFixed(2))}
                  >
                    50%
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPaymentAmount(selectedCustomerForPayment.totalOwed.toFixed(2))}
                  >
                    Full Amount
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-success/10 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Payment Amount:</span>
                  <span className="font-semibold">{parseFloat(paymentAmount || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining Balance:</span>
                  <span className="font-semibold">
                    {(selectedCustomerForPayment.totalOwed - parseFloat(paymentAmount || '0')).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePaymentSettlement}>
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile for the store
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
              <Label htmlFor="phone">Phone Number</Label>
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
    </div>
  );
}