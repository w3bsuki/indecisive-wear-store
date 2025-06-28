"use client"

import React from "react"
import { Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FilterBy, SortBy } from "./types"

interface ReviewFiltersProps {
  filterBy: FilterBy
  sortBy: SortBy
  onFilterChange: (value: FilterBy) => void
  onSortChange: (value: SortBy) => void
  totalReviews: number
  filteredCount: number
}

export const ReviewFilters = React.memo(function ReviewFilters({
  filterBy,
  sortBy,
  onFilterChange,
  onSortChange,
  totalReviews,
  filteredCount,
}: ReviewFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-2">
        <Select value={filterBy} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40 font-mono text-sm min-h-[44px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="with-photos">With Photos</SelectItem>
            <SelectItem value="5-star">5 Star</SelectItem>
            <SelectItem value="4-star">4 Star</SelectItem>
            <SelectItem value="3-star">3 Star</SelectItem>
            <SelectItem value="2-star">2 Star</SelectItem>
            <SelectItem value="1-star">1 Star</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40 font-mono text-sm min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
            <SelectItem value="with-photos">Photos First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-black/60 font-mono">
        Showing {filteredCount} of {totalReviews} reviews
      </p>
    </div>
  )
})