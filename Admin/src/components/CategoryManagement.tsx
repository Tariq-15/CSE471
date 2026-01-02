import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Plus, Edit, Trash2, Loader2, Folder } from "lucide-react";
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  type Category 
} from "@/lib/api";

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await createCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined
      });
      
      if (response.success) {
        setCategoryName("");
        setCategoryDescription("");
        setIsCreateDialogOpen(false);
        await fetchCategories();
      } else {
        alert(`Failed to create category: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Create category error:', err);
      alert(`Failed to create category: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined
      });
      
      if (response.success) {
        setCategoryName("");
        setCategoryDescription("");
        setEditingCategory(null);
        setIsEditDialogOpen(false);
        await fetchCategories();
      } else {
        alert(`Failed to update category: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Update category error:', err);
      alert(`Failed to update category: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm(`Are you sure you want to delete this category? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await deleteCategory(categoryId);
      if (response.success) {
        await fetchCategories();
      } else {
        alert(`Failed to delete category: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete category error:', err);
      alert(`Failed to delete category: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-black">Category Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage product categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Men's Clothing"
                />
              </div>
              <div>
                <Label htmlFor="category-description">Description (optional)</Label>
                <Input
                  id="category-description"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Brief description of this category"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setCategoryName("");
                setCategoryDescription("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCategory}
                disabled={!categoryName.trim() || isSubmitting}
                className="bg-[#576D64] hover:bg-[#465A52]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#576D64]" />
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No categories found matching your search' : 'No categories found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-black">{category.name}</TableCell>
                    <TableCell className="text-gray-600">{category.description || '—'}</TableCell>
                    <TableCell className="text-black font-medium">{category.products_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name *</Label>
              <Input
                id="edit-category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Men's Clothing"
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description">Description (optional)</Label>
              <Input
                id="edit-category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Brief description of this category"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingCategory(null);
              setCategoryName("");
              setCategoryDescription("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCategory}
              disabled={!categoryName.trim() || isSubmitting}
              className="bg-[#576D64] hover:bg-[#465A52]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

