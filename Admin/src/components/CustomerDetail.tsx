import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ArrowLeft, Edit, Save, Mail, Phone, MapPin, ShoppingBag, Calendar, Star } from "lucide-react";

interface CustomerDetailProps {
  customerId: number;
  onBack: () => void;
}

const mockCustomer = {
  id: 1,
  name: "Sarah Johnson",
  email: "sarah.j@email.com",
  phone: "+1 (555) 123-4567",
  avatar: "/api/placeholder/100/100",
  joinDate: "2024-01-15",
  lastOrder: "2024-09-20",
  status: "active",
  totalOrders: 12,
  totalSpent: 1245.99,
  averageOrderValue: 103.83,
  preferredCategories: ["Clothing", "Outerwear"],
  loyaltyPoints: 2450,
  addresses: [
    {
      id: 1,
      type: "shipping",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true
    },
    {
      id: 2,
      type: "billing",
      street: "123 Main Street",
      city: "New York",
      state: "NY", 
      zipCode: "10001",
      country: "United States",
      isDefault: true
    }
  ],
  orders: [
    {
      id: "ORD-001",
      date: "2024-09-20",
      status: "completed",
      total: 156.99,
      items: 3
    },
    {
      id: "ORD-015",
      date: "2024-08-15",
      status: "completed",
      total: 89.99,
      items: 1
    },
    {
      id: "ORD-022",
      date: "2024-07-28",
      status: "completed",
      total: 234.50,
      items: 4
    },
    {
      id: "ORD-031",
      date: "2024-06-12",
      status: "returned",
      total: 124.99,
      items: 2
    },
    {
      id: "ORD-045",
      date: "2024-05-03",
      status: "completed",
      total: 67.99,
      items: 1
    }
  ],
  notes: "VIP customer - Always provide priority support. Prefers email communication over phone calls."
};

export function CustomerDetail({ customerId, onBack }: CustomerDetailProps) {
  const [customer, setCustomer] = useState(mockCustomer);
  const [isEditing, setIsEditing] = useState(false);

  const getStatusBadge = (status: string) => {
    const config = {
      active: { variant: "default" as const, className: "bg-green-100 text-green-800", label: "Active" },
      inactive: { variant: "secondary" as const, className: "bg-gray-100 text-gray-800", label: "Inactive" },
      suspended: { variant: "destructive" as const, className: "", label: "Suspended" }
    };
    
    const statusConfig = config[status as keyof typeof config];
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      completed: { variant: "default" as const, className: "bg-green-100 text-green-800", label: "Completed" },
      failed: { variant: "destructive" as const, className: "", label: "Failed" },
      returned: { variant: "secondary" as const, className: "bg-orange-100 text-orange-800", label: "Returned" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-black">{customer.name}</h1>
          <p className="text-gray-600">Customer since {formatDate(customer.joinDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(customer.status)}
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-[#576D64] hover:bg-[#465A52]"
          >
            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {isEditing ? 'Save Changes' : 'Edit Customer'}
          </Button>
        </div>
      </div>

      {/* Customer Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#576D64]" />
              <div>
                <div className="text-2xl font-bold text-black">{customer.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${customer.totalSpent.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">${customer.averageOrderValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-black">{customer.loyaltyPoints.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Loyalty Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                    <AvatarFallback className="bg-[#576D64] text-white text-xl">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-black">{customer.name}</h3>
                    <p className="text-gray-600">{customer.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(customer.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer-name">Full Name</Label>
                    <Input 
                      id="customer-name" 
                      value={customer.name}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Email Address</Label>
                    <Input 
                      id="customer-email" 
                      value={customer.email}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Phone Number</Label>
                    <Input 
                      id="customer-phone" 
                      value={customer.phone}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Member Since</Label>
                    <p className="font-medium text-black">{formatDate(customer.joinDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Last Order</Label>
                    <p className="font-medium text-black">{formatDate(customer.lastOrder)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Preferred Categories</Label>
                  <div className="flex gap-2 mt-1">
                    {customer.preferredCategories.map((category) => (
                      <Badge key={category} variant="secondary" className="bg-[#F8F5EE] text-[#576D64]">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Lifetime Value</span>
                    <span className="font-medium text-green-600">${customer.totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Frequency</span>
                    <span className="font-medium text-black">1.2x per month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Rate</span>
                    <span className="font-medium text-black">8.3%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-[#576D64]" />
                    <span className="text-sm font-medium text-black">Contact Preferences</span>
                  </div>
                  <div className="space-y-1">
                    <Badge variant="outline" className="mr-2">Email</Badge>
                    <Badge variant="outline">SMS</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-black">{order.id}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(order.date)}</TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-gray-600">{order.items} items</TableCell>
                      <TableCell className="font-medium text-black">${order.total}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-[#576D64] hover:text-[#465A52]">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customer.addresses.map((address) => (
              <Card key={address.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {address.type === 'shipping' ? 'Shipping Address' : 'Billing Address'}
                    </span>
                    {address.isDefault && (
                      <Badge variant="secondary" className="bg-[#F8F5EE] text-[#576D64]">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-black">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.country}</p>
                  </div>
                  {isEditing && (
                    <div className="mt-4 space-y-2">
                      <Button variant="outline" size="sm" className="mr-2">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customer.notes}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                rows={6}
                placeholder="Add notes about this customer..."
              />
              {isEditing && (
                <div className="mt-4">
                  <Button className="bg-[#576D64] hover:bg-[#465A52]">
                    Save Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-black">Email Sent</span>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-600">Welcome back discount offer for returning customer</p>
                </div>
                <div className="border-l-4 border-green-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-black">Phone Call</span>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                  <p className="text-sm text-gray-600">Discussed return policy for Order #ORD-031</p>
                </div>
                <div className="border-l-4 border-yellow-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-black">Support Ticket</span>
                    <span className="text-xs text-gray-500">2 weeks ago</span>
                  </div>
                  <p className="text-sm text-gray-600">Size exchange request resolved successfully</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}