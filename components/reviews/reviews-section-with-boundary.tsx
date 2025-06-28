"use client"

import React from "react"
import { ReviewsSection } from "./reviews-section"
import { ReviewsErrorBoundary } from "./error-boundary"
import type { ReviewsSectionProps } from "./types"

export function ReviewsSectionWithBoundary(props: ReviewsSectionProps) {
  return (
    <ReviewsErrorBoundary>
      <ReviewsSection {...props} />
    </ReviewsErrorBoundary>
  )
}