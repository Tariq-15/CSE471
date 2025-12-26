import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, MapPin, Building2 } from "lucide-react";

const mockSuppliers = [
  {
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
    paymentTerms: "Net 30"
  },
  {
    id: 2,
    name: "Premium Textiles Ltd.",
    contactPerson: "Michael Chen",
    email: "michael@premiumtextiles.com",
    phone: "+1 (555) 234-5678",
    address: "456 Textile St, Los Angeles, CA 90001",
    category: "Fabrics",
    status: "active",
    productsSupplied: 23,
    totalOrders: 85,
    lastOrderDate: "2024-01-12",
    rating: 4.6,
    paymentTerms: "Net 15"
  },
  {
    id: 3,
    name: "Euro Leather Works",
    contactPerson: "Elena Rodriguez",
    email: "elena@euroleather.com",
    phone: "+1 (555) 345-6789",
    address: "789 Leather Lane, Chicago, IL 60001",
    category: "Leather Goods",
    status: "active",
    productsSupplied: 12,
    totalOrders: 45,
    lastOrderDate: "2024-01-08",
    rating: 4.9,
    paymentTerms: "Net 30"
  },
  {
    id: 4,
    name: "Global Accessories Hub",
    contactPerson: "David Kim",
    email: "david@globalaccessories.com",
    phone: "+1 (555) 456-7890",
    address: "321 Accessory Blvd, Miami, FL 33001",
    category: "Accessories",
    status: "pending",
    productsSupplied: 8,
    totalOrders: 15,
    lastOrderDate: "2024-01-05",
    rating: 4.2,
    paymentTerms: "Net 45"
  },
  {
    id: 5,
    name: "Sustainable Wear Solutions",
    contactPerson: "Anna Thompson",
    email: "anna@sustainablewear.com",
    phone: "+1 (555) 567-8901",
    address: "654 Eco Street, Portland, OR 97001",
    category: "Sustainable",
    status: "inactive",
    productsSupplied: 18,
    totalOrders: 28,
    lastOrderDate: "2023-12-20",
    rating: 4.4,
    paymentTerms: "Net 30"
  }
];

interface SuppliersManagementProps {
  onViewSupplier?: (supplierId: number) => void;
}

export function SuppliersManagement({ onViewSupplier }: SuppliersManagementProps) {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getRatingStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">Suppliers Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier-name">Company Name</Label>
                  <Input id="supplier-name" placeholder="Enter company name" />
                </div>
                <div>
                  <Label htmlFor="contact-person">Contact Person</Label>
                  <Input id="contact-person" placeholder="Contact person name" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier-email">Email</Label>
                  <Input id="supplier-email" type="email" placeholder="supplier@company.com" />
                </div>
                <div>
                  <Label htmlFor="supplier-phone">Phone</Label>
                  <Input id="supplier-phone" placeholder="+1 (555) 123-4567" />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier-address">Address</Label>
                <Textarea id="supplier-address" placeholder="Complete address..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="fabrics">Fabrics</SelectItem>
                      <SelectItem value="leather-goods">Leather Goods</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="sustainable">Sustainable</SelectItem>
                      <SelectItem value="footwear">Footwear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net-15">Net 15</SelectItem>
                      <SelectItem value="net-30">Net 30</SelectItem>
                      <SelectItem value="net-45">Net 45</SelectItem>
                      <SelectItem value="net-60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="supplier-notes">Notes</Label>
                <Textarea id="supplier-notes" placeholder="Additional notes about the supplier..." />
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Add Supplier
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-black flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#576D64]" />
                        {supplier.name}
                      </div>
                      <div className="text-sm text-gray-600">{supplier.contactPerson}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {supplier.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-[#F8F5EE] text-[#576D64] border-[#AAC0B5]">
                      {supplier.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{supplier.productsSupplied}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">{getRatingStars(supplier.rating)}</span>
                      <span className="text-sm text-gray-600">({supplier.rating})</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewSupplier?.(supplier.id)}
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
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
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
    </div>
  );
}