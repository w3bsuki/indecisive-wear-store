"use client"

import React from "react"
import { Star } from "lucide-react"
import type { RatingDistribution } from "./types"

interface ReviewStatsProps {
  averageRating: number
  totalReviews: number
  reviewsWithPhotos: number
  ratingDistribution: RatingDistribution[]
}

export const ReviewStats = React.memo(function ReviewStats({
  averageRating,
  totalReviews,
  reviewsWithPhotos,
  ratingDistribution,
}: ReviewStatsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold font-mono">{averageRating}</div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(averageRating) ? "text-black fill-black" : "text-black/30 fill-black/30"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-black/60 font-mono">Based on {totalReviews} reviews</p>
          <p className="text-xs text-black/50 font-mono">{reviewsWithPhotos} with photos</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {ratingDistribution.map(({ rating, count, percentage }) => (
          <div key={rating} className="flex items-center gap-3 text-sm">
            <span className="font-mono w-6">{rating}★</span>
            <div className="flex-1 bg-gray-200 h-2">
              <div className="bg-black h-2 transition-all duration-300" style={{ width: `${percentage}%` }} />
            </div>
            <span className="font-mono text-black/60 w-8">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
})