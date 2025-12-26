"use client"

import { useState, useEffect } from "react"
import { ProductReviews } from "./product-reviews"
import { getProduct, type Product } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductTabsProps {
  productId: string
}

export function ProductTabs({ productId }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await getProduct(productId)
        if (response.success && response.data) {
          setProduct(response.data)
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

  return (
    <div className="mb-16">
      {/* Tabs */}
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-6 py-3 font-semibold ${
            activeTab === "details"
              ? "border-b-2 border-black text-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Product Details
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-6 py-3 font-semibold ${
            activeTab === "reviews"
              ? "border-b-2 border-black text-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reviews
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="space-y-4 text-muted-foreground">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : product ? (
            <>
              <p>
                {product.description || 'No description available for this product.'}
              </p>

              {product.size && product.size.length > 0 && (
                <div>
                  <strong>Available Sizes:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {product.size.map((size, i) => (
                      <li key={i}>{size}</li>
                    ))}
                  </ul>
                </div>
              )}

              {product.color && product.color.length > 0 && (
                <div>
                  <strong>Available Colors:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {product.color.map((color, i) => (
                      <li key={i}>{color}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm">
                <strong>Product ID:</strong> {product.id}
              </p>
              
              {product.category && (
                <p className="text-sm">
                  <strong>Category:</strong> {product.category}
                </p>
              )}
            </>
          ) : (
            <p>Product details not available.</p>
          )}
        </div>
      )}

      {activeTab === "reviews" && <ProductReviews productId={productId} />}
    </div>
  )
}
