"use client"

import { Star } from "lucide-react"

interface ReviewSummaryProps {
  rating: number
  reviewCount: number
  isDark?: boolean
  size?: "sm" | "md" | "lg"
}

export function ReviewSummary({ rating, reviewCount, isDark = false, size = "sm" }: ReviewSummaryProps) {
  const starSize = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3"
  const textSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs"

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < Math.floor(rating)
              ? isDark
                ? "text-white fill-white"
                : "text-black fill-black"
              : isDark
                ? "text-white/30 fill-white/30"
                : "text-black/30 fill-black/30"
          }`}
        />
      ))}
      <span className={`${textSize} ml-1 ${isDark ? "text-white/60" : "text-black/60"}`}>({reviewCount})</span>
    </div>
  )
}
