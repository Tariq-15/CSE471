"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getWishlist, removeFromWishlist, type WishlistItem } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID from localStorage
    const userData = localStorage.getItem('user')
    const session = localStorage.getItem('session')
    
    let foundUserId: string | null = null
    
    if (userData) {
      try {
        const user = JSON.parse(userData)
        foundUserId = user.id || user.user_id || null
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    } else if (session) {
      try {
        const sessionData = JSON.parse(session)
        foundUserId = sessionData.user_id || null
      } catch (e) {
        // Ignore
      }
    }
    
    if (foundUserId) {
      setUserId(foundUserId)
    } else {
      toast.error("Please login to view your wishlist")
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchWishlist()
    }
  }, [userId])

  const fetchWishlist = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const response = await getWishlist(userId)
      if (response.success && response.data) {
        setWishlistItems(response.data)
      } else {
        toast.error(response.message || "Failed to load wishlist")
      }
    } catch (error) {
      toast.error("Failed to load wishlist")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!userId) return
    
    try {
      const response = await removeFromWishlist(userId, productId)
      if (response.success) {
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId))
        toast.success("Removed from wishlist")
      } else {
        toast.error(response.message || "Failed to remove from wishlist")
      }
    } catch (error) {
      toast.error("Failed to remove from wishlist")
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Wishlist</span>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          My Wishlist
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding items you love!</p>
            <Link href="/products">
              <Button>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative group">
                <Link href={`/product/${item.product_id}`}>
                  <ProductCard 
                    product={{
                      id: item.product_id,
                      name: item.name,
                      price: item.price,
                      originalPrice: null,
                      image: item.image || "/placeholder.svg",
                      rating: item.rating
                    }} 
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault()
                    handleRemoveFromWishlist(item.product_id)
                  }}
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

