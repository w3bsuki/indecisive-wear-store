"use client"

import React from "react"
import { Star, Camera } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ReviewImages } from "./review-images"
import { ReviewActions } from "./review-actions"
import type { Review } from "./types"

interface ReviewCardProps {
  review: Review
  productName: string
  onHelpful: (id: number, helpful: boolean) => void
}

export const ReviewCard = React.memo(function ReviewCard({ review, productName, onHelpful }: ReviewCardProps) {
  return (
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < review.rating ? "text-black fill-black" : "text-black/30 fill-black/30"}`}
              />
            ))}
          </div>
          <span className="font-mono font-bold text-sm">{review.customerName}</span>
          {review.verified && <Badge className="bg-green-100 text-green-800 text-xs font-mono">VERIFIED</Badge>}
          {review.images && review.images.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800 text-xs font-mono">
              <Camera className="h-3 w-3 mr-1" />
              {review.images.length} PHOTO{review.images.length > 1 ? "S" : ""}
            </Badge>
          )}
        </div>
        <span className="text-sm text-black/60 font-mono">{new Date(review.date).toLocaleDateString()}</span>
      </div>

      <h4 className="font-bold mb-2 font-mono">{review.title}</h4>
      <p className="text-sm text-black/80 leading-relaxed mb-4">{review.content}</p>

      {/* Review Images */}
      <ReviewImages images={review.images || []} reviewId={review.id} />

      <div className="flex items-center gap-4 mb-4 text-xs font-mono">
        <span>
          Size: <strong>{review.size}</strong>
        </span>
        <span>
          Fit: <strong>{review.fit}</strong>
        </span>
      </div>

      <ReviewActions review={review} productName={productName} onHelpful={onHelpful} />
    </div>
  )
})