"use client"

import { useState } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CartItem {
  id: number
  name: string
  size: string
  color: string
  price: number
  quantity: number
  image: string
}

const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: "Gradient Graphic T-shirt",
    size: "Large",
    color: "White",
    price: 145,
    quantity: 1,
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 2,
    name: "Checkered Shirt",
    size: "Medium",
    color: "Red",
    price: 180,
    quantity: 1,
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 3,
    name: "Skinny Fit Jeans",
    size: "Large",
    color: "Blue",
    price: 240,
    quantity: 1,
    image: "/placeholder.svg?height=120&width=120",
  },
]

export function CartItems() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems)

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)),
    )
  }

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      {cartItems.map((item) => (
        <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg bg-card">
          {/* Product Image */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Size:</span> {item.size}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Color:</span> {item.color}
                </p>
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
              <p className="text-xl font-bold">${item.price}</p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 bg-muted rounded-full px-3 py-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateQuantity(item.id, -1)}
                  className="h-6 w-6 rounded-full hover:bg-background"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateQuantity(item.id, 1)}
                  className="h-6 w-6 rounded-full hover:bg-background"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
