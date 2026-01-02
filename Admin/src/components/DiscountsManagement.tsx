import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Search, Edit, Trash2, Copy, Percent } from "lucide-react";

const mockDiscounts = [
  {
    id: 1,
    code: "SUMMER20",
    discount: 20,
    type: "percentage",
    expirationDate: "2024-12-31",
    status: "active",
    usageCount: 45,
    usageLimit: 100,
    minOrderValue: 50
  },
  {
    id: 2,
    code: "NEWCUSTOMER",
    discount: 15,
    type: "percentage",
    expirationDate: "2024-11-30",
    status: "active",
    usageCount: 123,
    usageLimit: 500,
    minOrderValue: 30
  },
  {
    id: 3,
    code: "FREESHIP",
    discount: 10,
    type: "fixed",
    expirationDate: "2024-10-15",
    status: "active",
    usageCount: 234,
    usageLimit: 1000,
    minOrderValue: 25
  },
  {
    id: 4,
    code: "FLASH50",
    discount: 50,
    type: "percentage",
    expirationDate: "2024-09-25",
    status: "expired",
    usageCount: 89,
    usageLimit: 100,
    minOrderValue: 100
  },
  {
    id: 5,
    code: "WELCOME10",
    discount: 10,
    type: "percentage",
    expirationDate: "2024-10-31",
    status: "paused",
    usageCount: 67,
    usageLimit: 200,
    minOrderValue: 20
  }
];

export function DiscountsManagement() {
  const [discounts, setDiscounts] = useState(mockDiscounts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredDiscounts = discounts.filter(discount =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, expirationDate: string) => {
    const isExpired = new Date(expirationDate) < new Date();
    
    if (isExpired || status === 'expired') {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (status === 'active') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    } else if (status === 'paused') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">Discounts & Promotions</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Discount</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discount-code">Discount Code</Label>
                <Input id="discount-code" placeholder="e.g., SAVE20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount-value">Value</Label>
                  <Input id="discount-value" type="number" placeholder="20" />
                </div>
              </div>
              <div>
                <Label htmlFor="expiration-date">Expiration Date</Label>
                <Input id="expiration-date" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage-limit">Usage Limit</Label>
                  <Input id="usage-limit" type="number" placeholder="100" />
                </div>
                <div>
                  <Label htmlFor="min-order">Min Order Value ($)</Label>
                  <Input id="min-order" type="number" placeholder="50" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Create Discount
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

      {/* Active Promotions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#576D64]" />
              <div>
                <div className="text-2xl font-bold text-black">
                  {discounts.filter(d => d.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Discounts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">
              {discounts.reduce((sum, d) => sum + d.usageCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Uses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">$12,450</div>
            <div className="text-sm text-gray-600">Discount Value Given</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">
              {discounts.filter(d => new Date(d.expirationDate) < new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Expired Codes</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search discount codes..."
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
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-black">
                        {discount.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(discount.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-black font-medium">
                    {discount.discount}{discount.type === 'percentage' ? '%' : '$'} off
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {discount.usageCount} / {discount.usageLimit}
                  </TableCell>
                  <TableCell className="text-gray-600">${discount.minOrderValue}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(discount.expirationDate)}</TableCell>
                  <TableCell>{getStatusBadge(discount.status, discount.expirationDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
              Showing {filteredDiscounts.length} of {discounts.length} discount codes
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