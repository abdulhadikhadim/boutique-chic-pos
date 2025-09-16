import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockProducts, mockSales, mockCustomers } from '@/data/mockData';
import { InventoryManagement } from './InventoryManagement';
import { useInventory } from '@/hooks/useInventory';
import InventoryService from '@/services/inventoryService';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Package,
  Store,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Settings,
  Target,
  Award,
  Clock
} from 'lucide-react';

export function OwnerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStore, setSelectedStore] = useState('main');
  
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    exportProducts, 
    importProducts,
    stats 
  } = useInventory(mockProducts);

  // Calculate advanced metrics
  const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = stats.potentialProfit;
  const avgOrderValue = totalRevenue / mockSales.length;
  const customerRetention = 85.4; // Mock percentage
  const inventoryValue = stats.totalValue;
  
  const handleUpdateProducts = (updatedProducts: any[]) => {
    // This will be handled by the inventory hook
    console.log('Products updated:', updatedProducts.length);
  };
  
  const lowStockProducts = InventoryService.getLowStockProducts(products);
  const outOfStockProducts = InventoryService.getOutOfStockProducts(products);
  const topSellingProducts = InventoryService.getTopSellingProducts(products);
  const categoryBreakdown = InventoryService.getProductsByCategory(products);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">Business analytics and insights</p>
        </div>
        <div className="flex space-x-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-0 bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-success">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            +18.2% vs last month
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
              <p className="text-2xl font-bold text-primary">${totalProfit.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-primary">
            <TrendingUp className="w-4 h-4 mr-1" />
            68% margin
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold text-accent-foreground">${avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-accent-foreground" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            +5.3% improvement
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-warning/10 to-warning/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Retention</p>
              <p className="text-2xl font-bold text-warning-foreground">{customerRetention}%</p>
            </div>
            <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            Industry avg: 79%
          </div>
        </Card>

        <Card className="p-4 border-0 bg-gradient-to-br from-muted/50 to-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold">${inventoryValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4 mr-1" />
            {mockProducts.length} products
          </div>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory-analytics">Inventory Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trends */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue Trends</h3>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg">
                  <div>
                    <p className="font-medium">January 2024</p>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">$24,500</p>
                    <div className="flex items-center text-sm text-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <div>
                    <p className="font-medium">December 2023</p>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">$21,800</p>
                    <div className="flex items-center text-sm text-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="font-medium">November 2023</p>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">$20,200</p>
                    <div className="flex items-center text-sm text-destructive">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -3%
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Performers */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Performing Products</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-3">
                {topSellingProducts.slice(0, 4).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${product.price}</p>
                      <Badge variant="secondary">{Math.max(0, 50 - product.stock)} sold</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory-analytics" className="space-y-4">
          <InventoryManagement 
            products={products} 
            onUpdateProducts={handleUpdateProducts}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
              <div className="space-y-3">
                {Object.entries(categoryBreakdown).map(([category, productList]) => {
                  const count = productList.length;
                  const categoryProducts = productList;
                  const categoryValue = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
                  const maxCount = Math.max(...Object.values(categoryBreakdown).map(arr => arr.length));
                  const isTopCategory = count === maxCount;
                  
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm">{category}</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={isTopCategory ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground"}>
                          {isTopCategory ? 'Top Category' : `${count} items`}
                        </Badge>
                        <span className="font-semibold">${categoryValue.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Health</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-success">92%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Inventory Turnover</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fast Moving</span>
                    <span className="text-success">65%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Normal</span>
                    <span>25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slow Moving</span>
                    <span className="text-warning">10%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profit Margins</h3>
              <div className="space-y-3">
                {products.slice(0, 3).map((product) => {
                  const margin = InventoryService.calculateProfitMargin(product);
                  return (
                    <div key={product.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{product.name}</span>
                        <span className="font-semibold">{margin.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(margin, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
                  <div>
                    <p className="font-medium">VIP Customers</p>
                    <p className="text-sm text-muted-foreground">$500+ lifetime value</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">{Math.round(mockCustomers.length * 0.15)}</p>
                    <p className="text-sm text-success">15% of base</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div>
                    <p className="font-medium">Regular Customers</p>
                    <p className="text-sm text-muted-foreground">$100-$499 lifetime value</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{Math.round(mockCustomers.length * 0.6)}</p>
                    <p className="text-sm text-primary">60% of base</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="font-medium">New Customers</p>
                    <p className="text-sm text-muted-foreground">Less than $100 spent</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{Math.round(mockCustomers.length * 0.25)}</p>
                    <p className="text-sm text-muted-foreground">25% of base</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Insights</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">7.2</p>
                  <p className="text-sm text-muted-foreground">Average visits per customer</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Repeat purchase rate</span>
                    <span className="font-semibold">73%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. days between visits</span>
                    <span className="font-semibold">28 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Customer satisfaction</span>
                    <span className="font-semibold text-success">4.6/5</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Forecast</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <p className="text-2xl font-bold text-success">$28,750</p>
                  <p className="text-sm text-muted-foreground">Projected February Revenue</p>
                  <div className="flex items-center justify-center mt-2 text-sm text-success">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +17% confidence
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Best case scenario</span>
                    <span className="font-semibold text-success">$32,100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expected</span>
                    <span className="font-semibold">$28,750</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conservative</span>
                    <span className="font-semibold text-muted-foreground">$25,400</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Recommendations</h3>
              <div className="space-y-3">
                <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Reorder Alert</span>
                    <Badge variant="outline" className="text-warning border-warning">
                      High Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    5 products need restocking within 7 days
                  </p>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Trend Opportunity</span>
                    <Badge variant="outline" className="text-primary border-primary">
                      Seasonal
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Spring collection showing 45% higher demand
                  </p>
                </div>
                <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Optimization</span>
                    <Badge variant="outline" className="text-success border-success">
                      Cost Saving
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bulk order can save $1,250 in February
                  </p>
                </div>
              </div>  
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Store Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Main Store</span>
                  <Badge className="bg-success/10 text-success">Excellent</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily avg. sales</span>
                    <span className="font-semibold">$1,250</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Foot traffic</span>
                    <span className="font-semibold">187/day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion rate</span>
                    <span className="font-semibold text-success">32%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alice Smith</span>
                  <Badge variant="secondary">Cashier</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Sales: $15,450 (This month)</p>
                  <p>Transactions: 287</p>
                  <p>Avg per sale: $53.83</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Status</span>
                  <Badge className="bg-success/10 text-success">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Backup</span>
                  <span className="text-sm font-medium">2 hours ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage Used</span>
                  <span className="text-sm font-medium">67%</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}