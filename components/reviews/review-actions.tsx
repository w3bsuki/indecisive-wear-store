"use client"

import React, { useState, useCallback } from "react"
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SocialShare } from "@/components/social-share"
import type { Review } from "./types"

interface ReviewActionsProps {
  review: Review
  productName: string
  onHelpful: (reviewId: number, isHelpful: boolean) => void
}

export const ReviewActions = React.memo(function ReviewActions({ review, productName, onHelpful }: ReviewActionsProps) {
  const [hasVoted, setHasVoted] = useState(false)

  const handleVote = useCallback(
    (isHelpful: boolean) => {
      if (!hasVoted) {
        onHelpful(review.id, isHelpful)
        setHasVoted(true)
      }
    },
    [hasVoted, onHelpful, review.id]
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm text-black/60 font-mono">Was this helpful?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVote(true)}
            disabled={hasVoted}
            className={`flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-mono transition-colors sharp-active ${
              hasVoted ? "text-black/40" : "text-black/60 hover:text-black"
            }`}
            aria-label={`Mark as helpful (${review.helpful})`}
          >
            <ThumbsUp className="h-3 w-3" />
            {review.helpful}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={hasVoted}
            className={`flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-mono transition-colors sharp-active ${
              hasVoted ? "text-black/40" : "text-black/60 hover:text-black"
            }`}
            aria-label={`Mark as not helpful (${review.notHelpful})`}
          >
            <ThumbsDown className="h-3 w-3" />
            {review.notHelpful}
          </button>
        </div>
      </div>

      {/* Social Share Button */}
      {review.images && review.images.length > 0 && (
        <SocialShare
          image={review.images[0]}
          productName={productName}
          customerName={review.customerName}
          rating={review.rating}
          reviewTitle={review.title}
          size={review.size}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-mono text-black/60 hover:text-black flex items-center gap-1"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </SocialShare>
      )}
    </div>
  )
})