"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCart, updateCartItem, removeCartItem, type CartItem } from "@/lib/api"
import { toast } from "sonner"

interface CartItemsProps {
  sessionId: string
  onCartUpdate?: () => void
  onCartDataChange?: (data: any) => void
}

export function CartItems({ sessionId, onCartUpdate, onCartDataChange }: CartItemsProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchCartItems()
    }
  }, [sessionId])

  const fetchCartItems = async () => {
    try {
      setLoading(true)
      const response = await getCart(sessionId)
      if (response.success && response.data) {
        const items = response.data.items || []
        console.log('Cart items fetched:', items)
        setCartItems(items)
        if (onCartDataChange) {
          onCartDataChange(response.data)
        }
      } else {
        console.log('Cart fetch failed:', response)
        setCartItems([])
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = cartItems.find(i => i.id === itemId)
    if (!item) return

    const newQuantity = Math.max(1, item.quantity + delta)
    
    try {
      const response = await updateCartItem(itemId, { quantity: newQuantity })
      if (response.success) {
        await fetchCartItems()
        if (onCartUpdate) {
          onCartUpdate()
        }
        toast.success("Cart updated")
      } else {
        toast.error(response.message || "Failed to update cart")
      }
    } catch (error) {
      toast.error("Failed to update cart")
      console.error(error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await removeCartItem(itemId)
      if (response.success) {
        await fetchCartItems()
        if (onCartUpdate) {
          onCartUpdate()
        }
        toast.success("Item removed from cart")
      } else {
        toast.error(response.message || "Failed to remove item")
      }
    } catch (error) {
      toast.error("Failed to remove item")
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-bold mb-6">Cart Items</h2>
        <p className="text-muted-foreground">Loading cart items...</p>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-bold mb-6">Cart Items</h2>
        <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-6">Cart Items</h2>
      <div className="space-y-4">
        {cartItems.map((item) => {
          // Handle product image - check both image_urls array and image_url
          let productImage = "/placeholder.svg"
          if (item.products) {
            if (item.products.image_urls && Array.isArray(item.products.image_urls) && item.products.image_urls.length > 0) {
              productImage = item.products.image_urls[0]
            } else if (item.products.image_url) {
              productImage = item.products.image_url
            }
          }
          
          const productName = item.products?.name || "Product"
          
          return (
            <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg bg-muted/50">
              {/* Product Image */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-background">
                <Image 
                  src={productImage} 
                  alt={productName} 
                  fill 
                  className="object-cover" 
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 truncate">
                      {productName}
                    </h3>
                    {item.size && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Size:</span> {item.size}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price and Quantity */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xl font-bold">৳{item.price.toFixed(2)}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-background rounded-full px-3 py-1.5 border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-6 w-6 rounded-full hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-6 w-6 rounded-full hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
