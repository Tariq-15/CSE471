import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react";
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, type Discount } from "@/lib/api";
import { toast } from "sonner";

export function DiscountsManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    expiration_date: '',
    status: 'active'
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await getDiscounts({ search: searchTerm });
      if (response.success && response.data) {
        setDiscounts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      toast.error('Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [searchTerm]);

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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleEditClick = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code || '',
      discount: discount.discount?.toString() || '',
      type: discount.type || 'percentage',
      expiration_date: discount.expiration_date || '',
      status: discount.status || 'active'
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const response = await deleteDiscount(discountId);
      if (response.success) {
        toast.success('Discount deleted successfully');
        fetchDiscounts();
      } else {
        toast.error(response.error || 'Failed to delete discount');
      }
    } catch (error) {
      console.error('Delete discount error:', error);
      toast.error('Failed to delete discount');
    }
  };

  const handleCreateDiscount = async () => {
    if (!formData.code || !formData.discount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await createDiscount({
        code: formData.code,
        discount: parseFloat(formData.discount),
        type: formData.type,
        expiration_date: formData.expiration_date,
        status: formData.status
      });

      if (response.success) {
        toast.success('Discount created successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchDiscounts();
      } else {
        toast.error(response.error || 'Failed to create discount');
      }
    } catch (error) {
      console.error('Create discount error:', error);
      toast.error('Failed to create discount');
    }
  };

  const handleUpdateDiscount = async () => {
    if (!editingDiscount || !formData.code || !formData.discount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await updateDiscount(editingDiscount.id.toString(), {
        code: formData.code,
        discount: parseFloat(formData.discount),
        type: formData.type,
        expiration_date: formData.expiration_date,
        status: formData.status
      });

      if (response.success) {
        toast.success('Discount updated successfully');
        setIsEditDialogOpen(false);
        setEditingDiscount(null);
        resetForm();
        fetchDiscounts();
      } else {
        toast.error(response.error || 'Failed to update discount');
      }
    } catch (error) {
      console.error('Update discount error:', error);
      toast.error('Failed to update discount');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: '',
      type: 'percentage',
      expiration_date: '',
      status: 'active'
    });
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
                <Input 
                  id="discount-code" 
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select value={formData.type} onValueChange={(value: string) => setFormData({...formData, type: value})}>
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
                  <Input 
                    id="discount-value" 
                    type="number" 
                    placeholder="20"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expiration-date">Expiration Date</Label>
                <Input 
                  id="expiration-date" 
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                  onClick={handleCreateDiscount}
                >
                  Create Discount
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
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
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Loading discounts...
                  </TableCell>
                </TableRow>
              ) : discounts.length > 0 ? (
                discounts.map((discount) => (
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
                      {discount.discount}{discount.type === 'percentage' ? '%' : '৳'} off
                    </TableCell>
                    <TableCell className="text-gray-600">{formatDate(discount.expiration_date || '')}</TableCell>
                    <TableCell>{getStatusBadge(discount.status || 'inactive', discount.expiration_date || '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClick(discount)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteClick(discount.id.toString())}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No discounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {discounts.length} discount codes
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-[#576D64] text-white border-[#576D64]">1</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-discount-code">Discount Code</Label>
              <Input 
                id="edit-discount-code" 
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-discount-type">Discount Type</Label>
                <Select value={formData.type} onValueChange={(value: string) => setFormData({...formData, type: value})}>
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
                <Label htmlFor="edit-discount-value">Value</Label>
                <Input 
                  id="edit-discount-value" 
                  type="number" 
                  placeholder="20"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-expiration-date">Expiration Date</Label>
              <Input 
                id="edit-expiration-date" 
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                onClick={handleUpdateDiscount}
              >
                Update Discount
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingDiscount(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}