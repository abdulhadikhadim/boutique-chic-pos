import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockProducts, mockSales, mockCustomers } from '@/data/mockData';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Clock,
  BarChart3,
  ShoppingCart,
  Calendar
} from 'lucide-react';

export function ManagerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Calculate metrics
  const totalSales = mockSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter(p => p.stock < 10);
  const totalCustomers = mockCustomers.length;

  const topSellingProducts = mockProducts
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

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
              <p className="text-2xl font-bold text-success">${totalSales.toFixed(2)}</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
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
              <h3 className="text-lg font-semibold">Inventory Overview</h3>
              <Button variant="outline" size="sm">Add Product</Button>
            </div>
            <div className="space-y-3">
              {mockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category} • SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${product.price}</p>
                    <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                      {product.stock} in stock
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Sales</h3>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {mockSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Sale #{sale.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.items.length} items • {new Date(sale.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">${sale.total.toFixed(2)}</p>
                    <Badge variant="secondary">{sale.paymentMethod}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customer Management</h3>
              <Button variant="outline" size="sm">Add Customer</Button>
            </div>
            <div className="space-y-3">
              {mockCustomers.map(customer => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email} • {customer.visits} visits</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${customer.totalSpent.toFixed(2)}</p>
                    <Badge variant="secondary">{customer.loyaltyPoints} points</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Month</span>
                  <span className="font-semibold text-success">$12,450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Month</span>
                  <span className="font-semibold">$10,230</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Growth</span>
                  <Badge className="bg-success/10 text-success">+21.7%</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dresses</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs">75%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Accessories</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs">50%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tops</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs">33%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}