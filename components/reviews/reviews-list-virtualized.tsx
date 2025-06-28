"use client"

import React from "react"
import { ReviewCard } from "./review-card"
import { useVirtualScroll } from "./hooks/use-virtual-scroll"
import type { Review } from "./types"

interface ReviewsListVirtualizedProps {
  reviews: Review[]
  productName: string
  onHelpful: (id: number, helpful: boolean) => void
}

const ITEM_HEIGHT = 300 // Approximate height of a review card
const CONTAINER_HEIGHT = 800 // Height of the scrollable container

export const ReviewsListVirtualized = React.memo(function ReviewsListVirtualized({
  reviews,
  productName,
  onHelpful,
}: ReviewsListVirtualizedProps) {
  const { scrollElementRef, visibleItems, totalHeight, offsetY, startIndex } = useVirtualScroll(reviews, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 2,
  })

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-black/60 font-mono">No reviews match your current filters.</p>
      </div>
    )
  }

  // For small lists, don't use virtualization
  if (reviews.length < 20) {
    return (
      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} productName={productName} onHelpful={onHelpful} />
        ))}
      </div>
    )
  }

  return (
    <div
      ref={scrollElementRef}
      className="overflow-auto"
      style={{ height: `${CONTAINER_HEIGHT}px` }}
      role="list"
      aria-label="Customer reviews"
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="space-y-6">
            {visibleItems.map((review, index) => (
              <div key={review.id} role="listitem" aria-setsize={reviews.length} aria-posinset={startIndex + index + 1}>
                <ReviewCard review={review} productName={productName} onHelpful={onHelpful} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})