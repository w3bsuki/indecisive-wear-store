export interface Review {
  id: number
  customerName: string
  rating: number
  title: string
  content: string
  date: string
  verified: boolean
  helpful: number
  notHelpful: number
  size: string
  fit: "Runs Small" | "True to Size" | "Runs Large"
  images?: string[]
}

export interface ReviewsSectionProps {
  productId: number
  productName: string
  averageRating: number
  totalReviews: number
}

export interface RatingDistribution {
  rating: number
  count: number
  percentage: number
}

export type SortBy = "newest" | "oldest" | "highest" | "lowest" | "helpful" | "with-photos"
export type FilterBy = "all" | "verified" | "with-photos" | "5-star" | "4-star" | "3-star" | "2-star" | "1-star"