"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getTopSelling, type Product } from "@/lib/api"
import Link from "next/link"

export function TopSelling() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await getTopSelling(4)
        if (response.success && response.data) {
          setProducts(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch top selling:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const formatProductForCard = (product: Product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price || null,
    image: product.image_urls?.[0] || product.image_url || "/placeholder.svg",
    rating: product.rating || 4.5,
  })

  return (
    <section className="py-16 lg:py-24 bg-accent">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12">TOP SELLING</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <ProductCard product={formatProductForCard(product)} />
              </Link>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              No top selling products at the moment
            </div>
          )}
        </div>

        <div className="flex justify-center mt-12">
          <Link href="/products">
            <Button variant="outline" size="lg" className="rounded-full px-12 bg-transparent">
              View All
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
