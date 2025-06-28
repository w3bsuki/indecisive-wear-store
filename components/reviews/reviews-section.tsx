"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Camera } from "lucide-react"
import { ReviewStats } from "./review-stats"
import { ReviewFilters } from "./review-filters"
import { ReviewCard } from "./review-card"
import { WriteReviewDialog } from "./review-form"
import { mockReviews } from "./mock-data"
import { filterReviews, sortReviews, calculateRatingDistribution } from "./utils"
import type { Review, ReviewsSectionProps, FilterBy, SortBy } from "./types"

export function ReviewsSection({ productId, productName, averageRating, totalReviews }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [filterBy, setFilterBy] = useState<FilterBy>("all")

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => calculateRatingDistribution(reviews), [reviews])

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    const filtered = filterReviews(reviews, filterBy)
    return sortReviews(filtered, sortBy)
  }, [reviews, filterBy, sortBy])

  // Count reviews with photos
  const reviewsWithPhotos = useMemo(
    () => reviews.filter((r) => r.images && r.images.length > 0).length,
    [reviews]
  )

  const handleHelpful = useCallback((reviewId: number, isHelpful: boolean) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              helpful: isHelpful ? review.helpful + 1 : review.helpful,
              notHelpful: !isHelpful ? review.notHelpful + 1 : review.notHelpful,
            }
          : review
      )
    )
  }, [])

  const handleReviewSubmit = useCallback((newReview: Review) => {
    setReviews((prev) => [newReview, ...prev])
  }, [])

  return (
    <div className="space-y-8">
      {/* Reviews Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rating Summary */}
        <ReviewStats
          averageRating={averageRating}
          totalReviews={totalReviews}
          reviewsWithPhotos={reviewsWithPhotos}
          ratingDistribution={ratingDistribution}
        />

        {/* Write Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-mono uppercase tracking-wider">Share Your Experience</h3>
          <p className="text-sm text-black/70">Help other customers by sharing your thoughts and photos.</p>
          <WriteReviewDialog productName={productName} onReviewSubmit={handleReviewSubmit}>
            <Button className="w-full bg-black text-white hover:bg-black/80 font-mono min-h-[44px] sharp-active">
              <Camera className="h-4 w-4 mr-2" />
              WRITE A REVIEW
            </Button>
          </WriteReviewDialog>
        </div>
      </div>

      <Separator />

      {/* Filters and Sorting */}
      <ReviewFilters
        filterBy={filterBy}
        sortBy={sortBy}
        onFilterChange={setFilterBy}
        onSortChange={setSortBy}
        totalReviews={reviews.length}
        filteredCount={filteredAndSortedReviews.length}
      />

      {/* Reviews List */}
      {filteredAndSortedReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-black/60 font-mono">No reviews match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} productName={productName} onHelpful={handleHelpful} />
          ))}
        </div>
      )}
    </div>
  )
}