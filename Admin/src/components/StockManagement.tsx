import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertTriangle, Package, TrendingDown, RotateCcw, Upload, History, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getStockOverview, getLowStockProducts, getOutOfStockProducts } from "@/lib/api";

interface StockCategory {
  category: string;
  total_items: number;
  low_stock: number;
  out_of_stock: number;
  value: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
}

interface OutOfStockProduct {
  id: string;
  name: string;
  category: string;
  last_order_date?: string;
}

export function StockManagement() {
  const [stockOverview, setStockOverview] = useState<StockCategory[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<OutOfStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const importHistory = [
    {
      id: 1,
      fileName: "inventory_update_2024_09_20.csv",
      date: "2024-09-20",
      status: "completed",
      itemsImported: 150,
      itemsUpdated: 45,
      errors: 0
    },
    {
      id: 2,
      fileName: "new_products_batch_3.xlsx",
      date: "2024-09-15",
      status: "completed",
      itemsImported: 75,
      itemsUpdated: 0,
      errors: 2
    },
    {
      id: 3,
      fileName: "seasonal_restock.csv",
      date: "2024-09-10",
      status: "completed",
      itemsImported: 200,
      itemsUpdated: 80,
      errors: 1
    },
    {
      id: 4,
      fileName: "supplier_update_failed.csv",
      date: "2024-09-05",
      status: "failed",
      itemsImported: 0,
      itemsUpdated: 0,
      errors: 25
    }
  ];

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, lowStockRes, outOfStockRes] = await Promise.all([
        getStockOverview(),
        getLowStockProducts(10),
        getOutOfStockProducts()
      ]);

      if (overviewRes.success && overviewRes.data) {
        setStockOverview(overviewRes.data);
      }

      if (lowStockRes.success && lowStockRes.data) {
        setLowStockItems(lowStockRes.data);
      }

      if (outOfStockRes.success && outOfStockRes.data) {
        setOutOfStockItems(outOfStockRes.data);
      }
    } catch (err) {
      setError('Failed to load stock data');
      console.error('Stock error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStockLevel = (current: number, minimum: number) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 25) return { level: "critical", color: "bg-red-500" };
    if (percentage <= 50) return { level: "low", color: "bg-yellow-500" };
    if (percentage <= 75) return { level: "medium", color: "bg-blue-500" };
    return { level: "good", color: "bg-green-500" };
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
              onClick={fetchStockData}
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">Stock Management</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#576D64] text-[#576D64] hover:bg-[#576D64] hover:text-white">
                <History className="w-4 h-4 mr-2" />
                View Import History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Import History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items Imported</TableHead>
                      <TableHead>Items Updated</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            {record.fileName}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'completed' ? 'default' : 'destructive'}
                            className={record.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {record.status === 'completed' ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Completed</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" />Failed</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.itemsImported}</TableCell>
                        <TableCell>{record.itemsUpdated}</TableCell>
                        <TableCell>
                          {record.errors > 0 ? (
                            <span className="text-red-600 font-medium">{record.errors}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
            <Upload className="w-4 h-4 mr-2" />
            Import Stock
          </Button>
        </div>
      </div>

      {/* Stock Overview by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stockOverview.length > 0 ? (
          stockOverview.map((category) => (
            <Card key={category.category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-black flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#576D64]" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Items</span>
                  <span className="font-medium text-black">{category.total_items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Low Stock</span>
                  <span className="font-medium text-yellow-600">{category.low_stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Out of Stock</span>
                  <span className="font-medium text-red-600">{category.out_of_stock}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Value</span>
                    <span className="font-medium text-black">${category.value.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-4">
            <CardContent className="p-6 text-center text-gray-500">
              No stock data available
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => {
                  const stockInfo = getStockLevel(item.current_stock, item.minimum_stock);
                  const percentage = (item.current_stock / item.minimum_stock) * 100;
                  
                  return (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-black">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <Badge variant={stockInfo.level === "critical" ? "destructive" : "secondary"}>
                          {item.current_stock} left
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock Level</span>
                          <span className="text-black">{item.current_stock} / {item.minimum_stock}</span>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No low stock items
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Out of Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outOfStockItems.length > 0 ? (
                outOfStockItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-black">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                    {item.last_order_date && (
                      <div className="text-sm text-gray-600">
                        Last updated: {new Date(item.last_order_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No out of stock items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <RotateCcw className="h-5 w-5 text-[#576D64]" />
            Reorder Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 border rounded-lg hover:bg-[#F8F5EE] transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-black">{item.name}</h4>
                      <Badge 
                        variant={item.current_stock < 5 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {item.current_stock < 5 ? 'High Priority' : 'Medium Priority'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Suggested quantity: {item.minimum_stock - item.current_stock}</span>
                      <span>Current: {item.current_stock}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-[#576D64] text-white rounded hover:bg-[#465A52] transition-colors">
                      Order Now
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      Later
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No reorder suggestions at this time
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
