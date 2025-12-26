import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Package, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  Edit,
  Plus,
  FileText,
  TrendingUp
} from "lucide-react";

const mockSupplierData = {
  1: {
    id: 1,
    name: "Fashion Forward Co.",
    contactPerson: "Sarah Johnson",
    email: "sarah@fashionforward.com",
    phone: "+1 (555) 123-4567",
    address: "123 Fashion Ave, New York, NY 10001",
    category: "Clothing",
    status: "active",
    productsSupplied: 45,
    totalOrders: 120,
    lastOrderDate: "2024-01-15",
    rating: 4.8,
    paymentTerms: "Net 30",
    joinedDate: "2022-03-15",
    totalSpent: 245000,
    notes: "Reliable supplier with excellent quality control. Specializes in premium cotton and sustainable fabrics.",
    recentOrders: [
      { id: "ORD-001", date: "2024-01-15", amount: 12500, status: "delivered", items: 25 },
      { id: "ORD-002", date: "2024-01-08", amount: 8900, status: "shipped", items: 18 },
      { id: "ORD-003", date: "2023-12-28", amount: 15600, status: "delivered", items: 32 },
      { id: "ORD-004", date: "2023-12-20", amount: 6700, status: "delivered", items: 14 }
    ],
    products: [
      { id: 1, name: "Premium Cotton T-Shirts", category: "Clothing", price: 15.99, stock: 150 },
      { id: 2, name: "Organic Denim Jeans", category: "Clothing", price: 45.00, stock: 80 },
      { id: 3, name: "Sustainable Hoodies", category: "Clothing", price: 35.99, stock: 65 },
      { id: 4, name: "Cotton Blend Sweaters", category: "Clothing", price: 28.50, stock: 90 }
    ],
    performance: {
      onTimeDelivery: 96,
      qualityRating: 4.8,
      responsiveness: 4.6,
      priceCompetitiveness: 4.4
    }
  }
};

interface SupplierDetailProps {
  supplierId: number;
  onBack: () => void;
}

export function SupplierDetail({ supplierId, onBack }: SupplierDetailProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  
  const supplier = mockSupplierData[supplierId as keyof typeof mockSupplierData];

  if (!supplier) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Suppliers
        </Button>
        <div className="text-center py-8">
          <p className="text-gray-600">Supplier not found</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "inactive":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge variant="default" className="bg-green-100 text-green-800">Delivered</Badge>;
      case "shipped":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Shipped</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-black">{supplier.name}</h2>
            <p className="text-gray-600">{supplier.contactPerson}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="order-products">Products</Label>
                  <Input id="order-products" placeholder="Select products..." />
                </div>
                <div>
                  <Label htmlFor="order-quantity">Quantity</Label>
                  <Input id="order-quantity" type="number" placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="order-notes">Order Notes</Label>
                  <Textarea id="order-notes" placeholder="Special instructions..." />
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                    onClick={() => setIsOrderDialogOpen(false)}
                  >
                    Create Order
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsOrderDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Company Name</Label>
                    <Input id="edit-name" defaultValue={supplier.name} />
                  </div>
                  <div>
                    <Label htmlFor="edit-contact">Contact Person</Label>
                    <Input id="edit-contact" defaultValue={supplier.contactPerson} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" defaultValue={supplier.email} />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input id="edit-phone" defaultValue={supplier.phone} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Textarea id="edit-address" defaultValue={supplier.address} />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" defaultValue={supplier.notes} />
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Supplier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-black">{supplier.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-[#576D64]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Products Supplied</p>
                <p className="text-2xl font-semibold text-black">{supplier.productsSupplied}</p>
              </div>
              <Package className="w-8 h-8 text-[#576D64]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-semibold text-black">${supplier.totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#576D64]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-black">{supplier.rating}</span>
                  <div className="text-yellow-500">{getRatingStars(supplier.rating)}</div>
                </div>
              </div>
              <Star className="w-8 h-8 text-[#576D64]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[#576D64]" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium text-black">{supplier.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#576D64]" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-black">{supplier.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#576D64]" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-black">{supplier.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(supplier.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <Badge variant="outline" className="bg-[#F8F5EE] text-[#576D64] border-[#AAC0B5]">
                    {supplier.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Terms</p>
                  <p className="font-medium text-black">{supplier.paymentTerms}</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#576D64] mt-1" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-black">{supplier.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#576D64] mt-1" />
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-black">{supplier.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">On-time Delivery</span>
                  <span className="font-medium text-black">{supplier.performance.onTimeDelivery}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#576D64] h-2 rounded-full" 
                    style={{ width: `${supplier.performance.onTimeDelivery}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Quality Rating</span>
                  <span className="font-medium text-black">{supplier.performance.qualityRating}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#576D64] h-2 rounded-full" 
                    style={{ width: `${(supplier.performance.qualityRating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Responsiveness</span>
                  <span className="font-medium text-black">{supplier.performance.responsiveness}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#576D64] h-2 rounded-full" 
                    style={{ width: `${(supplier.performance.responsiveness / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Price Competitiveness</span>
                  <span className="font-medium text-black">{supplier.performance.priceCompetitiveness}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#576D64] h-2 rounded-full" 
                    style={{ width: `${(supplier.performance.priceCompetitiveness / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Orders and Products */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-black">{order.id}</TableCell>
                      <TableCell className="text-gray-600">{order.date}</TableCell>
                      <TableCell className="text-gray-600">{order.items} items</TableCell>
                      <TableCell className="font-medium text-black">${order.amount.toLocaleString()}</TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Supplied Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-black">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-[#F8F5EE] text-[#576D64] border-[#AAC0B5]">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-black">${product.price}</TableCell>
                      <TableCell className="text-gray-600">{product.stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}