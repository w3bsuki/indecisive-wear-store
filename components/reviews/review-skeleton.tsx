"use client"

import React from "react"

export const ReviewSkeleton = React.memo(function ReviewSkeleton() {
  return (
    <div className="border-b border-black/10 pb-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 rounded" />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="w-20 h-20 bg-gray-200 rounded" />
        <div className="w-20 h-20 bg-gray-200 rounded" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-16 bg-gray-200 rounded" />
          <div className="h-10 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  )
})

export const ReviewsListSkeleton = React.memo(function ReviewsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <ReviewSkeleton key={i} />
      ))}
    </div>
  )
})