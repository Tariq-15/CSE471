"use client"

import { useState, useEffect } from "react"
import { Star, MoreVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getProductReviews, addProductReview, type Review } from "@/lib/api"

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(6)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await getProductReviews(productId)
        if (response.success && response.data) {
          setReviews(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (productId) {
      fetchReviews()
    }
  }, [productId])

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, reviews.length))
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating)
          const halfFilled = i === Math.floor(rating) && rating % 1 !== 0
          return (
            <Star
              key={i}
              className={`w-5 h-5 ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : halfFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
              }`}
            />
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-6 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reviews.slice(0, visibleCount).map((review) => (
          <div key={review.id} className="border border-border rounded-lg p-6 space-y-3 relative">
            {/* Three dots menu */}
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Rating */}
            {renderStars(review.rating)}

            {/* Name with verification badge */}
            <div className="flex items-center gap-2">
              <span className="font-semibold">{review.user_name}</span>
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Review text */}
            <p className="text-muted-foreground leading-relaxed">"{review.comment}"</p>

            {/* Date */}
            <p className="text-sm text-muted-foreground">Posted on {formatDate(review.posted_date)}</p>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < reviews.length && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline" className="px-12 bg-transparent">
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  )
}
