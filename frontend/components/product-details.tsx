"use client"

import { useState, useEffect } from "react"
import { Heart, Minus, Plus, Store, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getProduct, addToCart, type Product } from "@/lib/api"

interface ProductDetailsProps {
  productId: string
}

export function ProductDetails({ productId }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await getProduct(productId)
        if (response.success && response.data) {
          setProduct(response.data)
          // Set default selections
          if (response.data.color && response.data.color.length > 0) {
            setSelectedColor(response.data.color[0])
          }
          if (response.data.size && response.data.size.length > 0) {
            setSelectedSize(response.data.size[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleAddToCart = async () => {
    if (!product) return
    
    try {
      setAddingToCart(true)
      // Get or create session ID
      let sessionId = localStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('session_id', sessionId)
      }
      
      await addToCart({
        session_id: sessionId,
        product_id: product.id,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        price: product.price
      })
      
      alert('Added to cart!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    )
  }

  const images = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls 
    : [product.image_url || "/placeholder.svg"]

  const colors = product.color || []
  const sizes = product.size || []
  const rating = product.rating || 4.5
  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0

  const colorMap: Record<string, string> = {
    'Black': 'bg-black',
    'White': 'bg-white border border-gray-300',
    'Gray': 'bg-gray-400',
    'Grey': 'bg-gray-400',
    'Navy': 'bg-blue-900',
    'Blue': 'bg-blue-500',
    'Light Blue': 'bg-blue-300',
    'Red': 'bg-red-500',
    'Green': 'bg-green-500',
    'Yellow': 'bg-yellow-400',
    'Pink': 'bg-pink-400',
    'Brown': 'bg-amber-700',
    'Cream': 'bg-amber-100',
    'Burgundy': 'bg-red-900',
    'Olive': 'bg-olive-500',
    'Khaki': 'bg-yellow-700',
    'Beige': 'bg-amber-200',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
          <img
            src={images[selectedImageIndex] || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-3 gap-4">
            {images.slice(0, 3).map((image, index) => (
              <div
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-[4/5] overflow-hidden rounded-lg bg-muted cursor-pointer transition-all ${
                  selectedImageIndex === index ? 'ring-2 ring-black' : 'hover:opacity-80'
                }`}
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{rating}</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
          {product.original_price && product.original_price > product.price && (
            <>
              <span className="text-2xl text-muted-foreground line-through">
                ${product.original_price.toFixed(2)}
              </span>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-muted-foreground mb-6">{product.description}</p>
        )}

        {/* Add to Wishlist */}
        <Button variant="outline" className="mb-6 gap-2 bg-transparent">
          <Heart className="w-4 h-4" />
          Add to Wish List
        </Button>

        {/* Color Selection */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="text-sm font-semibold mb-3 block">Color: {selectedColor}</label>
            <div className="flex items-center gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full ${colorMap[color] || 'bg-gray-400'} ${
                    selectedColor === color ? "ring-2 ring-black ring-offset-2" : ""
                  } hover:scale-110 transition-transform`}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {sizes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Size:</label>
              <button className="text-sm text-muted-foreground hover:text-foreground">View size guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 px-4 rounded-lg border ${
                    selectedSize === size ? "border-black bg-black text-white" : "border-gray-300 hover:border-black"
                  } transition-colors`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity and Add to Cart */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="px-6 font-semibold">{quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            className="flex-1 bg-black text-white hover:bg-black/90 h-12"
            onClick={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Cart'
            )}
          </Button>
        </div>

        {/* Stock Status */}
        {product.stock !== undefined && (
          <div className="mb-6">
            {product.stock > 10 ? (
              <span className="text-green-600 text-sm">In Stock</span>
            ) : product.stock > 0 ? (
              <span className="text-orange-500 text-sm">Only {product.stock} left in stock</span>
            ) : (
              <span className="text-red-600 text-sm">Out of Stock</span>
            )}
          </div>
        )}

        {/* Shipping Info */}
        <div className="border border-border rounded-lg p-4 space-y-3 text-sm mb-6">
          <p>
            Enjoy <strong>FREE express</strong> & <strong>Free Returns</strong> on orders over $50!
          </p>
        </div>

        {/* Category & Tags */}
        {product.category && (
          <div className="border-t border-border pt-6">
            <p className="text-sm">
              <span className="font-semibold">Category:</span> {product.category}
            </p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {product.tags.map((tag, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
