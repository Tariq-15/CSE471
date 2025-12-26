import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Search, Edit, Trash2, Copy, Percent, Loader2 } from "lucide-react";
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, getDiscountStats } from "@/lib/api";
import type { Discount } from "@/lib/api";

export function DiscountsManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    active: 0,
    total_uses: 0,
    discount_value_given: 0,
    expired: 0
  });

  // New discount form state
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    expiration_date: '',
    usage_limit: '',
    min_order_value: ''
  });

  // Edit discount state
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const [editForm, setEditForm] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    expiration_date: '',
    usage_limit: '',
    min_order_value: '',
    status: 'active'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscounts();
    fetchStats();
  }, [currentPage, searchTerm]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDiscounts({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      if (response.success && response.data) {
        setDiscounts(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.total_pages);
          setTotal(response.pagination.total);
        }
      } else {
        setError(response.error || 'Failed to fetch discounts');
      }
    } catch (err) {
      setError('Failed to fetch discounts');
      console.error('Discounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getDiscountStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleCreateDiscount = async () => {
    if (!newDiscount.code || !newDiscount.discount || !newDiscount.expiration_date) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const discountData = {
        code: newDiscount.code.toUpperCase(),
        discount: parseFloat(newDiscount.discount),
        type: newDiscount.type as 'percentage' | 'fixed',
        expiration_date: newDiscount.expiration_date,
        usage_limit: parseInt(newDiscount.usage_limit) || 100,
        min_order_value: parseFloat(newDiscount.min_order_value) || 0
      };

      const response = await createDiscount(discountData);

      if (response.success) {
        setIsAddDialogOpen(false);
        setNewDiscount({
          code: '',
          discount: '',
          type: 'percentage',
          expiration_date: '',
          usage_limit: '',
          min_order_value: ''
        });
        fetchDiscounts();
        fetchStats();
      } else {
        alert(response.error || 'Failed to create discount');
      }
    } catch (err) {
      console.error('Create discount error:', err);
      alert('Failed to create discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (discount: Discount) => {
    setEditDiscount(discount);
    setEditForm({
      code: discount.code,
      discount: String(discount.discount),
      type: discount.type,
      expiration_date: discount.expiration_date?.split('T')[0] || '',
      usage_limit: String(discount.usage_limit),
      min_order_value: String(discount.min_order_value || 0),
      status: discount.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateDiscount = async () => {
    if (!editDiscount || !editForm.code || !editForm.discount || !editForm.expiration_date) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData = {
        code: editForm.code.toUpperCase(),
        discount: parseFloat(editForm.discount),
        type: editForm.type as 'percentage' | 'fixed',
        expiration_date: editForm.expiration_date,
        usage_limit: parseInt(editForm.usage_limit) || 100,
        min_order_value: parseFloat(editForm.min_order_value) || 0,
        status: editForm.status
      };

      const response = await updateDiscount(editDiscount.id, updateData);

      if (response.success) {
        setIsEditDialogOpen(false);
        setEditDiscount(null);
        fetchDiscounts();
        fetchStats();
      } else {
        alert(response.error || 'Failed to update discount');
      }
    } catch (err) {
      console.error('Update discount error:', err);
      alert('Failed to update discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const response = await deleteDiscount(discountId);
      
      if (response.success) {
        fetchDiscounts();
        fetchStats();
      } else {
        alert(response.error || 'Failed to delete discount');
      }
    } catch (err) {
      console.error('Delete discount error:', err);
      alert('Failed to delete discount');
    }
  };

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
  };

  if (loading && discounts.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#576D64]" />
      </div>
    );
  }

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
                <Label htmlFor="discount-code">Discount Code *</Label>
                <Input 
                  id="discount-code" 
                  placeholder="e.g., SAVE20"
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount({...newDiscount, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select 
                    value={newDiscount.type}
                    onValueChange={(value: string) => setNewDiscount({...newDiscount, type: value})}
                  >
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
                  <Label htmlFor="discount-value">Value *</Label>
                  <Input 
                    id="discount-value" 
                    type="number" 
                    placeholder="20"
                    value={newDiscount.discount}
                    onChange={(e) => setNewDiscount({...newDiscount, discount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expiration-date">Expiration Date *</Label>
                <Input 
                  id="expiration-date" 
                  type="date"
                  value={newDiscount.expiration_date}
                  onChange={(e) => setNewDiscount({...newDiscount, expiration_date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage-limit">Usage Limit</Label>
                  <Input 
                    id="usage-limit" 
                    type="number" 
                    placeholder="100"
                    value={newDiscount.usage_limit}
                    onChange={(e) => setNewDiscount({...newDiscount, usage_limit: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="min-order">Min Order Value ($)</Label>
                  <Input 
                    id="min-order" 
                    type="number" 
                    placeholder="50"
                    value={newDiscount.min_order_value}
                    onChange={(e) => setNewDiscount({...newDiscount, min_order_value: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                  onClick={handleCreateDiscount}
                  disabled={isSubmitting || !newDiscount.code || !newDiscount.discount || !newDiscount.expiration_date}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-discount-code">Discount Code *</Label>
              <Input 
                id="edit-discount-code" 
                placeholder="e.g., SAVE20"
                value={editForm.code}
                onChange={(e) => setEditForm({...editForm, code: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-discount-type">Discount Type</Label>
                <Select 
                  value={editForm.type}
                  onValueChange={(value: string) => setEditForm({...editForm, type: value})}
                >
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
                <Label htmlFor="edit-discount-value">Value *</Label>
                <Input 
                  id="edit-discount-value" 
                  type="number" 
                  placeholder="20"
                  value={editForm.discount}
                  onChange={(e) => setEditForm({...editForm, discount: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-expiration-date">Expiration Date *</Label>
                <Input 
                  id="edit-expiration-date" 
                  type="date"
                  value={editForm.expiration_date}
                  onChange={(e) => setEditForm({...editForm, expiration_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editForm.status}
                  onValueChange={(value: string) => setEditForm({...editForm, status: value})}
                >
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-usage-limit">Usage Limit</Label>
                <Input 
                  id="edit-usage-limit" 
                  type="number" 
                  placeholder="100"
                  value={editForm.usage_limit}
                  onChange={(e) => setEditForm({...editForm, usage_limit: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-min-order">Min Order Value ($)</Label>
                <Input 
                  id="edit-min-order" 
                  type="number" 
                  placeholder="50"
                  value={editForm.min_order_value}
                  onChange={(e) => setEditForm({...editForm, min_order_value: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                onClick={handleUpdateDiscount}
                disabled={isSubmitting || !editForm.code || !editForm.discount || !editForm.expiration_date}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Update Discount
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

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={fetchDiscounts}
              className="mt-2 bg-[#576D64] hover:bg-[#465A52]"
              size="sm"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Promotions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#576D64]" />
              <div>
                <div className="text-2xl font-bold text-black">
                  {stats.active}
                </div>
                <div className="text-sm text-gray-600">Active Discounts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">
              {stats.total_uses}
            </div>
            <div className="text-sm text-gray-600">Total Uses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${stats.discount_value_given.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Discount Value Given</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">
              {stats.expired}
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#576D64]" />
            </div>
          ) : (
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
                {discounts.length > 0 ? (
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
                        {discount.discount}{discount.type === 'percentage' ? '%' : '$'} off
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {discount.usage_count} / {discount.usage_limit}
                      </TableCell>
                      <TableCell className="text-gray-600">${discount.min_order_value || 0}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(discount.expiration_date)}</TableCell>
                      <TableCell>{getStatusBadge(discount.status, discount.expiration_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenEdit(discount)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDiscount(discount.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No discount codes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {discounts.length} of {total} discount codes
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <Button 
                  key={page}
                  variant="outline" 
                  size="sm" 
                  className={currentPage === page ? "bg-[#576D64] text-white border-[#576D64]" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
