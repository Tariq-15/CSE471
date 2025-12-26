import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, User, MapPin, CreditCard } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const mockOrder = {
  id: "ORD-001",
  customer: {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "/api/placeholder/40/40"
  },
  orderDate: "2024-09-23T10:30:00Z",
  status: "pending",
  paymentStatus: "paid",
  shippingMethod: "Standard Shipping",
  trackingNumber: "UPS1234567890",
  billingAddress: {
    street: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States"
  },
  shippingAddress: {
    street: "123 Main Street",
    city: "New York", 
    state: "NY",
    zipCode: "10001",
    country: "United States"
  },
  items: [
    {
      id: 1,
      productId: 1,
      name: "Classic Denim Jacket",
      sku: "DJ-001-M-BLU",
      size: "M",
      color: "Blue",
      price: 89.99,
      quantity: 1,
      image: "/api/placeholder/60/60"
    },
    {
      id: 2,
      productId: 2,
      name: "Cotton Basic T-Shirt",
      sku: "CT-002-L-WHT",
      size: "L",
      color: "White",
      price: 24.99,
      quantity: 2,
      image: "/api/placeholder/60/60"
    },
    {
      id: 3,
      productId: 3,
      name: "Leather Ankle Boots",
      sku: "LAB-003-9-BLK",
      size: "9",
      color: "Black",
      price: 159.99,
      quantity: 1,
      image: "/api/placeholder/60/60"
    }
  ],
  subtotal: 299.97,
  shipping: 12.99,
  tax: 24.99,
  discount: 15.00,
  total: 322.95,
  notes: "Please leave package at front door if no one is available.",
  orderHistory: [
    {
      status: "Order Placed",
      date: "2024-09-23T10:30:00Z",
      description: "Order has been successfully placed"
    },
    {
      status: "Payment Confirmed",
      date: "2024-09-23T10:31:00Z",
      description: "Payment has been processed successfully"
    },
    {
      status: "Processing",
      date: "2024-09-23T11:00:00Z",
      description: "Order is being prepared for shipment"
    }
  ]
};

export function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const [order, setOrder] = useState(mockOrder);
  const [newStatus, setNewStatus] = useState(order.status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      processing: { variant: "secondary" as const, className: "bg-blue-100 text-blue-800", label: "Processing" },
      shipped: { variant: "secondary" as const, className: "bg-purple-100 text-purple-800", label: "Shipped" },
      completed: { variant: "default" as const, className: "bg-green-100 text-green-800", label: "Completed" },
      failed: { variant: "destructive" as const, className: "", label: "Failed" },
      cancelled: { variant: "destructive" as const, className: "", label: "Cancelled" },
      returned: { variant: "secondary" as const, className: "bg-orange-100 text-orange-800", label: "Returned" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config.variant} className={config.className}>
        {getStatusIcon(status)}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const updateOrderStatus = () => {
    setOrder({ ...order, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-black">Order {order.id}</h1>
          <p className="text-gray-600">Placed on {formatDate(order.orderDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : ''}>
            {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
          </Badge>
        </div>
      </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#576D64]" />
              <div>
                <div className="text-2xl font-bold text-black">{order.items.length}</div>
                <div className="text-sm text-gray-600">Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">${order.total}</div>
            <div className="text-sm text-gray-600">Total Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${order.subtotal}</div>
            <div className="text-sm text-gray-600">Subtotal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">${order.shipping}</div>
            <div className="text-sm text-gray-600">Shipping</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-black">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.size} • {item.color}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell className="font-medium">${(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-black">${order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-black">${order.shipping}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-black">${order.tax}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-${order.discount}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-black">Total</span>
                  <span className="text-black">${order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium text-black">{order.customer.name}</div>
                <div className="text-sm text-gray-600">{order.customer.email}</div>
                <div className="text-sm text-gray-600">{order.customer.phone}</div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-black">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm">
                  <div className="font-medium text-black">Shipping Method</div>
                  <div className="text-gray-600">{order.shippingMethod}</div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-2">
                    <div className="font-medium text-black">Tracking Number</div>
                    <div className="text-sm font-mono text-[#576D64]">{order.trackingNumber}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : ''}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="text-black">Credit Card</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Card</span>
                  <span className="text-black">**** 4567</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={updateOrderStatus}
                disabled={newStatus === order.status}
                className="w-full bg-[#576D64] hover:bg-[#465A52]"
              >
                Update Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderHistory.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 bg-[#576D64] rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-black">{event.status}</div>
                  <div className="text-sm text-gray-600">{event.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(event.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}