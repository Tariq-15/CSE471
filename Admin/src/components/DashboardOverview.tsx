import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Users, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react";
import { getDashboardStats, getSalesData, getBestSellingProducts, getLowStockItems } from "@/lib/api";
import type { DashboardStats, SalesData, BestSellingProduct, LowStockItem } from "@/lib/api";

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, salesRes, bestSellingRes, lowStockRes] = await Promise.all([
        getDashboardStats(),
        getSalesData('month'),
        getBestSellingProducts(5),
        getLowStockItems(4)
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (salesRes.success && salesRes.data) {
        setSalesData(salesRes.data);
      }

      if (bestSellingRes.success && bestSellingRes.data) {
        setBestSelling(bestSellingRes.data);
      }

      if (lowStockRes.success && lowStockRes.data) {
        setLowStock(lowStockRes.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#576D64]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-[#576D64] text-white rounded hover:bg-[#465A52]"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              ${stats?.total_revenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-[#576D64] mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {stats?.total_orders?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-[#576D64] mt-1">+8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Customers</CardTitle>
            <Users className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {stats?.new_customers || '0'}
            </div>
            <p className="text-xs text-[#576D64] mt-1">+23% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
            <Package className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {stats?.total_products || '0'}
            </div>
            <p className="text-xs text-red-500 mt-1">
              {stats?.low_stock_count || 0} low stock items
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#576D64" 
                    strokeWidth={2}
                    dot={{ fill: '#576D64', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Best Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bestSelling.length > 0 ? (
                bestSelling.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#576D64] rounded-full"></div>
                      <span className="text-black">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{product.sales} sold</span>
                      <Badge 
                        variant={product.stock < 10 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {product.stock} left
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Orders Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F8F5EE] p-4 rounded-lg">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-xl font-bold text-black">
                  {stats?.pending_orders || 0}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-xl font-bold text-green-600">
                  {stats?.completed_orders || 0}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Failed</div>
                <div className="text-xl font-bold text-red-600">
                  {stats?.failed_orders || 0}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Returned</div>
                <div className="text-xl font-bold text-yellow-600">
                  {stats?.returned_orders || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStock.length > 0 ? (
                lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-black">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.category}</div>
                    </div>
                    <Badge variant="destructive">
                      {item.stock} left
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No low stock items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
