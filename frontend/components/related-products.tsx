"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getRelatedProducts, type Product } from "@/lib/api"
import Link from "next/link"

interface RelatedProductsProps {
  productId: string
}

export function RelatedProducts({ productId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelated() {
      try {
        const response = await getRelatedProducts(productId)
        if (response.success && response.data) {
          setProducts(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (productId) {
      fetchRelated()
    }
  }, [productId])

  const formatProductForCard = (product: Product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price || null,
    image: product.image?.[0] || product.image_urls?.[0] || product.image_url || "/placeholder.svg",
    rating: product.rating || 4.0,
  })

  if (loading) {
    return (
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center mb-8">Related Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <Link key={product.id || `product-${index}`} href={`/product/${product.id}`}>
            <ProductCard product={formatProductForCard(product)} />
          </Link>
        ))}
      </div>
    </div>
  )
}
