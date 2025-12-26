import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ArrowLeft, Edit, Save, Plus, Trash2, Image, Package } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
}

const mockProduct = {
  id: 1,
  name: "Classic Denim Jacket",
  description: "A timeless denim jacket crafted from premium cotton denim. Features classic styling with button closure, chest pockets, and a comfortable regular fit. Perfect for layering in any season.",
  category: "Outerwear",
  brand: "Unleashed",
  tags: ["denim", "casual", "classic", "outerwear"],
  status: "active",
  createdDate: "2024-08-15",
  lastUpdated: "2024-09-20",
  totalStock: 45,
  totalSold: 234,
  variations: [
    {
      id: 1,
      sku: "DJ-001-S-BLU",
      size: "S",
      color: "Blue",
      colorHex: "#1E40AF",
      price: 89.99,
      stock: 12,
      sold: 45,
      image: "/api/placeholder/300/300"
    },
    {
      id: 2,
      sku: "DJ-001-M-BLU",
      size: "M", 
      color: "Blue",
      colorHex: "#1E40AF",
      price: 89.99,
      stock: 18,
      sold: 67,
      image: "/api/placeholder/300/300"
    },
    {
      id: 3,
      sku: "DJ-001-L-BLU",
      size: "L",
      color: "Blue", 
      colorHex: "#1E40AF",
      price: 89.99,
      stock: 15,
      sold: 78,
      image: "/api/placeholder/300/300"
    },
    {
      id: 4,
      sku: "DJ-001-S-BLK",
      size: "S",
      color: "Black",
      colorHex: "#000000",
      price: 94.99,
      stock: 8,
      sold: 23,
      image: "/api/placeholder/300/300"
    },
    {
      id: 5,
      sku: "DJ-001-M-BLK",
      size: "M",
      color: "Black",
      colorHex: "#000000", 
      price: 94.99,
      stock: 0,
      sold: 21,
      image: "/api/placeholder/300/300"
    }
  ]
};

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState(mockProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddVariationOpen, setIsAddVariationOpen] = useState(false);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock < 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const totalRevenue = product.variations.reduce((sum, v) => sum + (v.sold * v.price), 0);
  const avgPrice = product.variations.reduce((sum, v) => sum + v.price, 0) / product.variations.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-[#576D64]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-black">{product.name}</h1>
          <p className="text-gray-600">{product.category} • SKU: DJ-001</p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          className="bg-[#576D64] hover:bg-[#465A52]"
        >
          {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
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
                <div className="text-2xl font-bold text-black">{product.totalStock}</div>
                <div className="text-sm text-gray-600">Total Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">{product.totalSold}</div>
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
            <div className="text-2xl font-bold text-[#576D64]">${avgPrice.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Average Price</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="variations">Variations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input 
                    id="product-name" 
                    value={product.name}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea 
                    id="product-description" 
                    value={product.description}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-category">Category</Label>
                    <Select disabled={!isEditing}>
                      <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                        <SelectValue placeholder={product.category} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="footwear">Footwear</SelectItem>
                        <SelectItem value="outerwear">Outerwear</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-brand">Brand</Label>
                    <Input 
                      id="product-brand" 
                      value={product.brand}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="product-tags">Tags</Label>
                  <Input 
                    id="product-tags" 
                    value={product.tags.join(", ")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                    placeholder="Separate tags with commas"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Status & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Created Date</Label>
                  <p className="text-gray-600 mt-1">{new Date(product.createdDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                  })}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-gray-600 mt-1">{new Date(product.lastUpdated).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Variations:</span>
                      <span className="font-medium text-black">{product.variations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Variations:</span>
                      <span className="font-medium text-black">{product.variations.filter(v => v.stock > 0).length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Variations</CardTitle>
                <Dialog open={isAddVariationOpen} onOpenChange={setIsAddVariationOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#576D64] hover:bg-[#465A52]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Variation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="variation-size">Size</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xs">XS</SelectItem>
                              <SelectItem value="s">S</SelectItem>
                              <SelectItem value="m">M</SelectItem>
                              <SelectItem value="l">L</SelectItem>
                              <SelectItem value="xl">XL</SelectItem>
                              <SelectItem value="xxl">XXL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="variation-color">Color</Label>
                          <Input id="variation-color" placeholder="Color name" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="variation-price">Price ($)</Label>
                          <Input id="variation-price" type="number" placeholder="0.00" />
                        </div>
                        <div>
                          <Label htmlFor="variation-stock">Stock</Label>
                          <Input id="variation-stock" type="number" placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="variation-sku">SKU</Label>
                        <Input id="variation-sku" placeholder="Auto-generated or custom" />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-[#576D64] hover:bg-[#465A52]"
                          onClick={() => setIsAddVariationOpen(false)}
                        >
                          Add Variation
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setIsAddVariationOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variations.map((variation) => {
                    const stockStatus = getStockStatus(variation.stock);
                    return (
                      <TableRow key={variation.id}>
                        <TableCell>
                          <ImageWithFallback
                            src={variation.image}
                            alt={`${product.name} - ${variation.color} ${variation.size}`}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{variation.sku}</TableCell>
                        <TableCell>{variation.size}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: variation.colorHex }}
                            ></div>
                            {variation.color}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">${variation.price}</TableCell>
                        <TableCell>{variation.stock}</TableCell>
                        <TableCell className="text-gray-600">{variation.sold}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Units Sold</span>
                    <span className="font-bold text-black">{product.totalSold}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Revenue Generated</span>
                    <span className="font-bold text-green-600">${totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Selling Price</span>
                    <span className="font-bold text-black">${avgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-bold text-[#576D64]">12.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Stock Level</span>
                    <span className="font-bold text-black">{product.totalStock}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Low Stock Variations</span>
                    <span className="font-bold text-yellow-600">
                      {product.variations.filter(v => v.stock < 10 && v.stock > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Out of Stock</span>
                    <span className="font-bold text-red-600">
                      {product.variations.filter(v => v.stock === 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stock Turnover</span>
                    <span className="font-bold text-[#576D64]">5.2x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}