import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, User, MapPin, CreditCard, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getOrder, updateOrderStatus } from "@/lib/api";

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

interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: string;
  order_number?: string;
  status: string;
  created_at: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_method?: string;
  customers?: {
    full_name?: string;
    email?: string;
    phone_number?: string;
    district?: string;
    thana?: string;
    full_address?: string;
  };
  order_items?: OrderItem[];
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id || '';

  const onBack = () => {
    navigate('/orders');
  };
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrder(orderId);
      
      if (response.success && response.data) {
        const orderData = response.data as any;
        setOrder({
          id: orderData.id || orderId,
          order_number: orderData.order_number || `ORD-${orderId.slice(0, 8).toUpperCase()}`,
          status: orderData.status || 'pending',
          created_at: orderData.created_at || orderData.order_date || new Date().toISOString(),
          subtotal: parseFloat(String(orderData.subtotal || 0)),
          discount: parseFloat(String(orderData.discount || 0)),
          delivery_fee: parseFloat(String(orderData.delivery_fee || orderData.shipping || 0)),
          total: parseFloat(String(orderData.total || 0)),
          payment_method: orderData.payment_method || 'Cash on Delivery',
          customers: orderData.customers || {},
          order_items: (orderData.order_items || []) as OrderItem[]
        });
        setNewStatus(orderData.status || 'pending');
      } else {
        setError(response.error || 'Failed to load order');
      }
    } catch (err) {
      setError('Failed to load order');
      console.error('Order fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateOrderStatus = async () => {
    if (!order) return;
    
    try {
      const response = await updateOrderStatus(order.id, newStatus);
      if (response.success) {
        setOrder({ ...order, status: newStatus });
        alert('Order status updated successfully');
      } else {
        alert(response.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update order status');
    }
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

  if (error || !order) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64] mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error || 'Order not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data for rendering
  const customer = order.customers || {};
  const items: OrderItem[] = order.order_items || [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-black">Order {order.order_number || order.id}</h1>
          <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <Badge variant="default" className="bg-green-100 text-green-800">
            {order.payment_method || 'Cash on Delivery'}
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
                <div className="text-2xl font-bold text-black">{totalItems}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">${order.total.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${order.subtotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Subtotal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">${order.delivery_fee.toFixed(2)}</div>
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
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ImageWithFallback
                              src={item.product_image || '/placeholder.svg'}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-medium text-black">{item.product_name}</div>
                              {(item.size || item.color) && (
                                <div className="text-sm text-gray-600">
                                  {item.size ? `${item.size}` : ''}
                                  {item.size && item.color ? ' • ' : ''}
                                  {item.color ? `${item.color}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.product_id?.slice(0, 8) || 'N/A'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${parseFloat(String(item.price)).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${(parseFloat(String(item.price)) * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-black">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-black">${order.delivery_fee.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Discount</span>
                    <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-black">Total</span>
                  <span className="text-black">${order.total.toFixed(2)}</span>
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
                <div className="font-medium text-black">{customer.full_name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{customer.email || 'N/A'}</div>
                <div className="text-sm text-gray-600">{customer.phone_number || 'N/A'}</div>
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
                <p>{customer.full_address || 'N/A'}</p>
                {customer.thana && <p>{customer.thana}</p>}
                {customer.district && <p>{customer.district}</p>}
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
                  <span className="text-gray-600">Method</span>
                  <span className="text-black font-medium">{order.payment_method || 'Cash on Delivery'}</span>
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
                onClick={handleUpdateOrderStatus}
                disabled={newStatus === order.status}
                className="w-full bg-[#576D64] hover:bg-[#465A52]"
              >
                Update Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}