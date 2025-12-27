"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getProducts, type Product } from "@/lib/api"
import Link from "next/link"

export function ProductsGrid() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("newest")
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  const limit = 9 // Products per page
  
  // Read page from URL or default to 1
  const pageParam = searchParams.get('page')
  const currentPage = pageParam ? Number(pageParam) : 1

  // Read URL params for tag and sort on initial load
  useEffect(() => {
    const sort = searchParams.get('sort')
    
    if (sort) {
      // Map backend sort to frontend sort
      const sortMap: Record<string, string> = {
        "best_selling": "popular",
        "newest": "newest",
        "price_high_low": "price-high",
        "price_low_high": "price-low"
      }
      const mappedSort = sortMap[sort] || "newest"
      if (mappedSort !== sortBy) {
        setSortBy(mappedSort)
      }
    }
  }, [searchParams])
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/products?${params.toString()}`)
  }
  
  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Map frontend sort to backend sort
    const sortMap: Record<string, string> = {
      "price-high": "price_high_low",
      "price-low": "price_low_high",
      "newest": "newest",
      "popular": "best_selling"
    }
    
    const backendSort = sortMap[newSort] || "newest"
    params.set('sort', backendSort)
    params.delete('page') // Reset to page 1 when sort changes
    
    router.push(`/products?${params.toString()}`)
  }

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        
        // Get sort from URL params or use sortBy state
        const sortFromUrl = searchParams.get('sort')
        let backendSort = "newest"
        
        if (sortFromUrl) {
          // Use sort from URL directly (already in backend format)
          backendSort = sortFromUrl
        } else {
          // Map frontend sort values to backend sort values
          const sortMap: Record<string, string> = {
            "price-high": "price_high_low",
            "price-low": "price_low_high",
            "newest": "newest",
            "popular": "best_selling"
          }
          backendSort = sortMap[sortBy] || "newest"
        }
        
        // Get filters from URL params
        const tag = searchParams.get('tag')
        const minPrice = searchParams.get('min_price')
        const maxPrice = searchParams.get('max_price')
        const color = searchParams.get('color')
        const category = searchParams.get('category')
        
        const response = await getProducts({
          page: currentPage,
          limit: limit,
          sort: backendSort,
          tag: tag || undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          color: color || undefined,
          category: category || undefined
        })
        
        if (response.success && response.data) {
          setProducts(response.data)
          if (response.pagination) {
            setTotalPages(response.pagination.total_pages || 1)
            setTotalProducts(response.pagination.total || 0)
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [currentPage, sortBy, searchParams])

  const formatProductForCard = (product: Product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price || null,
    image: product.image_urls?.[0] || product.image_url || product.image?.[0] || "/placeholder.svg",
    rating: product.rating || 4.5,
  })

  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push("...")
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...")
      }
      
      // Show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Products</h1>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalProducts)} of {totalProducts} Products
            </span>
          )}
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product, index) => (
            <Link key={product.id || `product-${index}`} href={`/product/${product.id}`}>
              <ProductCard product={formatProductForCard(product)} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No products found</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-border pt-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {visiblePages.map((page, index) => (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "ghost"}
              className={currentPage === page ? "bg-black text-white hover:bg-black/90" : ""}
              onClick={() => typeof page === "number" && handlePageChange(page)}
              disabled={page === "..." || loading}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
