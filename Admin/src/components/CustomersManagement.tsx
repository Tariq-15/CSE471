import { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Search, Eye, Edit, Trash2, Mail } from "lucide-react";

const mockCustomers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-01-15",
    ordersCount: 12,
    totalSpent: 1245.99,
    status: "active"
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike.chen@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-03-22",
    ordersCount: 8,
    totalSpent: 654.50,
    status: "active"
  },
  {
    id: 3,
    name: "Emma Wilson",
    email: "emma.w@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-02-10",
    ordersCount: 15,
    totalSpent: 2100.25,
    status: "active"
  },
  {
    id: 4,
    name: "David Brown",
    email: "david.brown@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2023-11-05",
    ordersCount: 3,
    totalSpent: 187.99,
    status: "inactive"
  },
  {
    id: 5,
    name: "Lisa Garcia",
    email: "lisa.garcia@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-06-18",
    ordersCount: 7,
    totalSpent: 445.75,
    status: "active"
  },
  {
    id: 6,
    name: "James Taylor",
    email: "james.t@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-04-12",
    ordersCount: 11,
    totalSpent: 890.50,
    status: "active"
  },
  {
    id: 7,
    name: "Maria Rodriguez",
    email: "maria.r@email.com",
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-08-03",
    ordersCount: 2,
    totalSpent: 125.99,
    status: "active"
  }
];

interface CustomersManagementProps {
  onViewCustomer?: (customerId: number) => void;
}

export function CustomersManagement({ onViewCustomer }: CustomersManagementProps) {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">Customers Management</h2>
        <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
          <Mail className="w-4 h-4 mr-2" />
          Send Newsletter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback className="bg-[#576D64] text-white">
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-black">{customer.name}</div>
                        <div className={`text-xs ${customer.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                          {customer.status}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{customer.email}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(customer.joinDate)}</TableCell>
                  <TableCell className="text-black font-medium">{customer.ordersCount}</TableCell>
                  <TableCell className="text-black font-medium">${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewCustomer?.(customer.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-[#576D64] text-white border-[#576D64]">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">{customers.length}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">
              {customers.filter(c => c.joinDate.startsWith('2024-09')).length}
            </div>
            <div className="text-sm text-gray-600">New This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">
              ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}