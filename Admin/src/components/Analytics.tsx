import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";

const salesData = {
  daily: [
    { name: 'Mon', sales: 1200, customers: 24 },
    { name: 'Tue', sales: 1900, customers: 38 },
    { name: 'Wed', sales: 800, customers: 16 },
    { name: 'Thu', sales: 2200, customers: 44 },
    { name: 'Fri', sales: 2800, customers: 56 },
    { name: 'Sat', sales: 3200, customers: 64 },
    { name: 'Sun', sales: 2100, customers: 42 }
  ],
  weekly: [
    { name: 'Week 1', sales: 12000, customers: 240 },
    { name: 'Week 2', sales: 15000, customers: 300 },
    { name: 'Week 3', sales: 11000, customers: 220 },
    { name: 'Week 4', sales: 18000, customers: 360 }
  ],
  monthly: [
    { name: 'Jan', sales: 45000, customers: 900 },
    { name: 'Feb', sales: 52000, customers: 1040 },
    { name: 'Mar', sales: 48000, customers: 960 },
    { name: 'Apr', sales: 61000, customers: 1220 },
    { name: 'May', sales: 55000, customers: 1100 },
    { name: 'Jun', sales: 67000, customers: 1340 }
  ]
};

const categoryData = [
  { name: 'Clothing', value: 45, color: '#576D64' },
  { name: 'Footwear', value: 25, color: '#AAC0B5' },
  { name: 'Outerwear', value: 20, color: '#8B9D94' },
  { name: 'Accessories', value: 10, color: '#F8F5EE' }
];

const trafficData = [
  { source: 'Search', visitors: 3200, percentage: 45 },
  { source: 'Social Media', visitors: 1800, percentage: 25 },
  { source: 'Direct', visitors: 1400, percentage: 20 },
  { source: 'Referrals', visitors: 700, percentage: 10 }
];

const customerGrowthData = [
  { month: 'Jan', customers: 450 },
  { month: 'Feb', customers: 520 },
  { month: 'Mar', customers: 480 },
  { month: 'Apr', customers: 610 },
  { month: 'May', customers: 580 },
  { month: 'Jun', customers: 720 },
  { month: 'Jul', customers: 650 }
];

export function Analytics() {
  const [activeTab, setActiveTab] = useState("daily");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">Analytics & Reports</h2>
        <Button variant="outline" className="border-[#576D64] text-[#576D64] hover:bg-[#576D64] hover:text-white">
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">$126,500</div>
            <p className="text-xs text-green-600 mt-1">+15.2% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">2,534</div>
            <p className="text-xs text-green-600 mt-1">+8.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Customers</CardTitle>
            <Users className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">345</div>
            <p className="text-xs text-green-600 mt-1">+23.5% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#576D64]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">$49.90</div>
            <p className="text-xs text-red-600 mt-1">-2.3% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black">Sales Overview</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesData[activeTab as keyof typeof salesData]}>
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
                dataKey="sales" 
                stroke="#576D64" 
                strokeWidth={3}
                dot={{ fill: '#576D64', strokeWidth: 2, r: 6 }}
                name="Sales ($)"
              />
              <Line 
                type="monotone" 
                dataKey="customers" 
                stroke="#AAC0B5" 
                strokeWidth={2}
                dot={{ fill: '#AAC0B5', strokeWidth: 2, r: 4 }}
                name="Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-black">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium text-black">{category.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="customers" fill="#576D64" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficData.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#576D64] rounded-full"></div>
                  <span className="text-black font-medium">{source.source}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#576D64] h-2 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-16">{source.visitors.toLocaleString()}</span>
                  <span className="text-sm font-medium text-black w-8">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}