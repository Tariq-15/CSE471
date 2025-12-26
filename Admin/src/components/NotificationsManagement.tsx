import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Bell, Search, CheckCircle, AlertTriangle, Info, Users, Package, ShoppingCart } from "lucide-react";

const mockNotifications = [
  {
    id: 1,
    type: "order",
    title: "New Order Received",
    message: "Order #ORD-001 from Sarah Johnson for $156.99",
    timestamp: "2024-09-23T10:30:00Z",
    isRead: false,
    priority: "high"
  },
  {
    id: 2,
    type: "stock",
    title: "Low Stock Alert",
    message: "Leather Ankle Boots now has only 2 items remaining",
    timestamp: "2024-09-23T09:15:00Z",
    isRead: false,
    priority: "medium"
  },
  {
    id: 3,
    type: "user",
    title: "New Customer Registration",
    message: "Mike Chen has created a new account",
    timestamp: "2024-09-23T08:45:00Z",
    isRead: true,
    priority: "low"
  },
  {
    id: 4,
    type: "order",
    title: "Order Completed",
    message: "Order #ORD-002 has been successfully delivered",
    timestamp: "2024-09-22T16:20:00Z",
    isRead: true,
    priority: "low"
  },
  {
    id: 5,
    type: "stock",
    title: "Out of Stock",
    message: "Premium Sneakers is now out of stock",
    timestamp: "2024-09-22T14:10:00Z",
    isRead: false,
    priority: "high"
  },
  {
    id: 6,
    type: "user",
    title: "Customer Support Request",
    message: "Emma Wilson submitted a return request for Order #ORD-003",
    timestamp: "2024-09-22T11:30:00Z",
    isRead: true,
    priority: "medium"
  },
  {
    id: 7,
    type: "order",
    title: "Payment Failed",
    message: "Payment failed for Order #ORD-004 from David Brown",
    timestamp: "2024-09-21T15:45:00Z",
    isRead: false,
    priority: "high"
  },
  {
    id: 8,
    type: "stock",
    title: "Stock Replenished",
    message: "Cotton T-Shirt Basic stock has been replenished (50 items added)",
    timestamp: "2024-09-21T09:00:00Z",
    isRead: true,
    priority: "low"
  }
];

export function NotificationsManagement() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "unread" && !notification.isRead) ||
                         (statusFilter === "read" && notification.isRead);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    const icons = {
      order: <ShoppingCart className="w-5 h-5 text-blue-500" />,
      stock: <Package className="w-5 h-5 text-orange-500" />,
      user: <Users className="w-5 h-5 text-green-500" />
    };
    return icons[type as keyof typeof icons] || <Info className="w-5 h-5 text-gray-500" />;
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { variant: "destructive" as const, label: "High" },
      medium: { variant: "secondary" as const, label: "Medium" },
      low: { variant: "outline" as const, label: "Low" }
    };
    return config[priority as keyof typeof config];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-black">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="border-[#576D64] text-[#576D64] hover:bg-[#576D64] hover:text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#576D64]" />
              <div>
                <div className="text-2xl font-bold text-black">{notifications.length}</div>
                <div className="text-sm text-gray-600">Total Notifications</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {notifications.filter(n => n.type === 'order').length}
            </div>
            <div className="text-sm text-gray-600">Order Updates</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const priorityConfig = getPriorityBadge(notification.priority);
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.isRead 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium ${notification.isRead ? 'text-gray-900' : 'text-black'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={priorityConfig.variant} className="text-xs">
                            {priorityConfig.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800'} mb-2`}>
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-[#576D64] text-white border-[#576D64]">1</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}