"use client"

import { useState, useEffect } from "react"
import { Star, MoreVertical, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getProductReviews, addProductReview, getUserProfile, type Review } from "@/lib/api"
import { toast } from "sonner"

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(6)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user_id from localStorage
    const getUserData = () => {
      try {
        const sessionData = localStorage.getItem('sb-session')
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          const foundUserId = parsed?.user?.id || parsed?.user_id || null
          setUserId(foundUserId)
          
          // Fetch user profile to get name
          if (foundUserId) {
            getUserProfile(foundUserId).then((response) => {
              if (response.success && response.data) {
                const fullName = response.data.first_name && response.data.last_name
                  ? `${response.data.first_name} ${response.data.last_name}`
                  : response.data.first_name || response.data.last_name || "User"
                setUserName(fullName)
              }
            }).catch(() => {
              // If profile fetch fails, try to get from session
              const user = parsed?.user
              if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name)
              } else if (user?.email) {
                setUserName(user.email.split('@')[0])
              }
            })
          }
        }
      } catch (error) {
        console.error('Failed to get user data:', error)
      }
    }
    
    getUserData()
  }, [])

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await getProductReviews(productId, userId || undefined)
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
  }, [productId, userId])

  const handleSubmitReview = async () => {
    if (!userName || userRating === 0) {
      toast.error("Please provide your name and rating")
      return
    }

    try {
      setSubmittingReview(true)
      const response = await addProductReview(productId, {
        user_name: userName,
        rating: userRating,
        comment: userComment,
        user_id: userId || undefined
      })

      if (response.success) {
        toast.success("Review submitted successfully!")
        setIsReviewDialogOpen(false)
        setUserRating(0)
        setUserComment("")
        // Refresh reviews
        const reviewsResponse = await getProductReviews(productId, userId || undefined)
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data)
        }
      } else {
        toast.error(response.error || "Failed to submit review")
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      toast.error("Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, reviews.length))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date'
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

  return (
    <div>
      {/* Add Review Button */}
      <div className="mb-6 flex justify-end">
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="review-name">Your Name</Label>
                <Input
                  id="review-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={!!userId} // Disable if logged in
                />
                {userId && <p className="text-xs text-muted-foreground mt-1">Name fetched from your account</p>}
              </div>
              <div>
                <Label>Rating *</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setUserRating(rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= userRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="review-comment">Comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSubmitReview}
                disabled={submittingReview || !userName || userRating === 0}
                className="w-full bg-[#576D64] hover:bg-[#465A52]"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <>
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
                  {review.is_verified_purchase && (
                    <div className="flex items-center gap-1 text-green-600" title="Verified Purchase">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-medium">Verified Purchase</span>
                    </div>
                  )}
                </div>

                {/* Review text */}
                {review.comment && (
                  <p className="text-muted-foreground leading-relaxed">"{review.comment}"</p>
                )}

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
        </>
      )}
    </div>
  )
}
