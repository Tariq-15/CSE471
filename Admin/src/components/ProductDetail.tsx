import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ArrowLeft, Edit, Save, Package, Loader2, Ruler, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { getProduct, updateProduct, getSizeChartTemplates, getSizeChartTemplate } from "@/lib/api";
import type { Product, SizeChartTemplate } from "@/lib/api";

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

interface SizeStock {
  size_label: string;
  stock: number;
  row_id: number;
}

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Size Chart Template State
  const [templates, setTemplates] = useState<SizeChartTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sizeStocks, setSizeStocks] = useState<SizeStock[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Image state
  const [productImages, setProductImages] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    original_price: 0,
    status: "active"
  });

  useEffect(() => {
    fetchProduct();
    fetchTemplates();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await getProduct(String(productId));
      if (response.success && response.data) {
        setProduct(response.data);
        setFormData({
          name: response.data.name || "",
          description: response.data.description || "",
          category: response.data.category || "",
          price: response.data.price || 0,
          original_price: response.data.original_price || 0,
          status: response.data.status || "active"
        });
        
        // Initialize images
        const images: string[] = [];
        if (response.data.image_urls && response.data.image_urls.length > 0) {
          images.push(...response.data.image_urls);
        } else if (response.data.image_url) {
          images.push(response.data.image_url);
        }
        setProductImages(images);
        
        // If product has a size chart template, load it
        if (response.data.size_chart_template_id) {
          setSelectedTemplateId(String(response.data.size_chart_template_id));
          
          // Check if product has existing size stocks
          if (response.data.size_stocks && response.data.size_stocks.length > 0) {
            // Use existing size stocks from API
            setSizeStocks(response.data.size_stocks.map((item: any) => ({
              size_label: item.size_label,
              stock: item.stock || 0,
              row_id: item.row_id
            })));
          } else {
            // Fetch template details to initialize sizes
            fetchTemplateDetails(response.data.size_chart_template_id);
          }
        } else if (response.data.size && response.data.size.length > 0) {
          // Initialize sizes from product's existing sizes (legacy)
          setSizeStocks(response.data.size.map((s, i) => ({
            size_label: s,
            stock: response.data?.stock || 0,
            row_id: i
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getSizeChartTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchTemplateDetails = async (templateId: number) => {
    try {
      setLoadingTemplate(true);
      const response = await getSizeChartTemplate(templateId);
      if (response.success && response.data && response.data.rows) {
        // Check if product already has size stocks for this template
        if (product && product.size_stocks && product.size_stocks.length > 0) {
          // Map existing stocks to template rows
          const stocks = response.data.rows.map(row => {
            const existingStock = product.size_stocks?.find((s: any) => s.row_id === row.id);
            return {
              size_label: row.size_label,
              stock: existingStock ? existingStock.stock : 0,
              row_id: row.id
            };
          });
          setSizeStocks(stocks);
        } else {
          // Initialize size stocks from template rows with 0 stock
          const stocks = response.data.rows.map(row => ({
            size_label: row.size_label,
            stock: 0,
            row_id: row.id
          }));
          setSizeStocks(stocks);
        }
      }
    } catch (error) {
      console.error('Failed to fetch template details:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      fetchTemplateDetails(parseInt(templateId));
    } else {
      setSizeStocks([]);
    }
  };

  const handleStockChange = (index: number, stock: number) => {
    setSizeStocks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], stock };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!product) return;
    
    try {
      setIsSaving(true);
      
      // Calculate total stock from all sizes
      const totalStock = sizeStocks.reduce((sum, s) => sum + s.stock, 0);
      
      // Prepare update data
      const updateData: any = {
        ...formData,
        stock: totalStock,
        size: sizeStocks.map(s => s.size_label),
        size_chart_template_id: selectedTemplateId ? parseInt(selectedTemplateId) : null,
        image_url: productImages[0] || null,
        image_urls: productImages
      };
      
      // Add size_stocks array if template is selected
      if (selectedTemplateId && sizeStocks.length > 0) {
        updateData.size_stocks = sizeStocks.map(s => ({
          row_id: s.row_id,
          stock: s.stock
        }));
      }
      
      const response = await updateProduct(String(product.id), updateData);
      
      if (response.success) {
        setProduct(prev => prev ? { ...prev, ...updateData } : null);
        setIsEditing(false);
      } else {
        alert(response.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const totalStock = sizeStocks.reduce((sum, s) => sum + s.stock, 0);
  const totalSold = product?.sold || 0;
  const totalRevenue = totalSold * (product?.price || 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#576D64]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <div className="text-center py-16">
          <p className="text-gray-500">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-black">{product.name}</h1>
          <p className="text-gray-600">{product.category} • ID: {product.id}</p>
        </div>
        <Button 
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="bg-[#576D64] hover:bg-[#465A52]"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isEditing ? (
            <Save className="w-4 h-4 mr-2" />
          ) : (
            <Edit className="w-4 h-4 mr-2" />
          )}
          {isEditing ? 'Save Changes' : 'Edit Product'}
        </Button>
      </div>

      {/* Product Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#576D64]" />
              <div>
                <div className="text-2xl font-bold text-black">{totalStock}</div>
                <div className="text-sm text-gray-600">Total Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">{totalSold}</div>
            <div className="text-sm text-gray-600">Total Sold</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#576D64]">${product.price?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Current Price</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="variations">Size & Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input 
                      id="product-name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product-category">Category</Label>
                      <Select 
                        disabled={!isEditing}
                        value={formData.category}
                        onValueChange={(value: string) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                          <SelectValue placeholder={formData.category || "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Clothing">Clothing</SelectItem>
                          <SelectItem value="Footwear">Footwear</SelectItem>
                          <SelectItem value="Outerwear">Outerwear</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="T-shirts">T-shirts</SelectItem>
                          <SelectItem value="Pants">Pants</SelectItem>
                          <SelectItem value="Dresses">Dresses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product-status">Status</Label>
                      <Select 
                        disabled={!isEditing}
                        value={formData.status}
                        onValueChange={(value: string) => setFormData({...formData, status: value})}
                      >
                        <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product-price">Price ($)</Label>
                      <Input 
                        id="product-price" 
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-original-price">Original Price ($)</Label>
                      <Input 
                        id="product-original-price" 
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => setFormData({...formData, original_price: parseFloat(e.target.value) || 0})}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-gray-50" : ""}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea 
                    id="product-description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={!isEditing}
                    className={`min-h-[200px] ${!isEditing ? "bg-gray-50" : ""}`}
                    rows={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={productImages}
                onImagesChange={setProductImages}
                maxImages={5}
                disabled={!isEditing}
              />
              {!isEditing && productImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No images uploaded</p>
                  <p className="text-sm">Click "Edit Product" to add images</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  Size Chart & Stock Management
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Size Chart Template Selector */}
              <div className="max-w-md">
                <Label htmlFor="size-template" className="text-base font-semibold">Select Size Chart Template</Label>
                <p className="text-sm text-gray-500 mb-2">Choose a template to auto-populate available sizes</p>
                <Select 
                  value={selectedTemplateId}
                  onValueChange={handleTemplateChange}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                    <SelectValue placeholder="Select a size chart template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Template (Custom Sizes)</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size and Stock Table */}
              {loadingTemplate ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#576D64]" />
                </div>
              ) : sizeStocks.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-black w-1/2">Size</TableHead>
                        <TableHead className="font-semibold text-black w-1/2">Stock Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sizeStocks.map((item, index) => (
                        <TableRow key={item.row_id}>
                          <TableCell className="font-medium text-lg">
                            <Badge variant="outline" className="text-base px-4 py-1">
                              {item.size_label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={(e) => handleStockChange(index, parseInt(e.target.value) || 0)}
                              disabled={!isEditing}
                              className={`w-32 text-center ${!isEditing ? "bg-gray-50" : ""}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Total Stock Summary */}
                  <div className="bg-[#576D64]/10 px-4 py-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#576D64]">Total Stock:</span>
                      <span className="text-xl font-bold text-[#576D64]">{totalStock} units</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                  <Ruler className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">No sizes configured</p>
                  <p className="text-sm text-gray-400">
                    {isEditing 
                      ? "Select a size chart template above to configure sizes and stock"
                      : "Click 'Edit Product' and select a size chart template to add sizes"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
