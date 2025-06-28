import type { Review, FilterBy, SortBy } from "./types"

export function filterReviews(reviews: Review[], filterBy: FilterBy): Review[] {
  switch (filterBy) {
    case "all":
      return reviews
    case "verified":
      return reviews.filter((review) => review.verified)
    case "with-photos":
      return reviews.filter((review) => review.images && review.images.length > 0)
    case "5-star":
      return reviews.filter((review) => review.rating === 5)
    case "4-star":
      return reviews.filter((review) => review.rating === 4)
    case "3-star":
      return reviews.filter((review) => review.rating === 3)
    case "2-star":
      return reviews.filter((review) => review.rating === 2)
    case "1-star":
      return reviews.filter((review) => review.rating === 1)
    default:
      return reviews
  }
}

export function sortReviews(reviews: Review[], sortBy: SortBy): Review[] {
  const sorted = [...reviews]
  
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    case "oldest":
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    case "highest":
      return sorted.sort((a, b) => b.rating - a.rating)
    case "lowest":
      return sorted.sort((a, b) => a.rating - b.rating)
    case "helpful":
      return sorted.sort((a, b) => b.helpful - a.helpful)
    case "with-photos":
      return sorted.sort((a, b) => (b.images?.length || 0) - (a.images?.length || 0))
    default:
      return sorted
  }
}

export function calculateRatingDistribution(reviews: Review[]) {
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100 
      : 0,
  }))
}