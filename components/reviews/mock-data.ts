import type { Review } from "./types"

// Mock reviews data with images
export const mockReviews: Review[] = [
  {
    id: 1,
    customerName: "Sarah M.",
    rating: 5,
    title: "Perfect Essential Tee",
    content:
      "This tee is exactly what I was looking for. The quality is outstanding - soft, well-made, and the fit is perfect. I'm 5'6\" and ordered a medium, fits true to size. The minimalist design is exactly what I wanted. Will definitely be ordering more colors!",
    date: "2024-01-15",
    verified: true,
    helpful: 12,
    notHelpful: 0,
    size: "M",
    fit: "True to Size",
    images: [
      "/placeholder.svg?height=400&width=400&text=Review+Photo+1",
      "/placeholder.svg?height=400&width=400&text=Review+Photo+2",
    ],
  },
  {
    id: 2,
    customerName: "Alex K.",
    rating: 4,
    title: "Great quality, slightly oversized",
    content:
      "Love the quality and the clean design. The fabric feels premium and washes well. Only reason for 4 stars instead of 5 is that it runs a bit larger than expected. I usually wear L but could have gone with M. Still keeping it though - the oversized look works!",
    date: "2024-01-10",
    verified: true,
    helpful: 8,
    notHelpful: 1,
    size: "L",
    fit: "Runs Large",
    images: ["/placeholder.svg?height=400&width=400&text=Fit+Comparison"],
  },
  {
    id: 3,
    customerName: "Jordan P.",
    rating: 5,
    title: "Minimalist perfection",
    content:
      "This is my third purchase from Indecisive Wear and they never disappoint. The attention to detail is incredible - from the stitching to the fabric choice. This tee has become my go-to for both casual and slightly dressed up looks. Highly recommend!",
    date: "2024-01-08",
    verified: true,
    helpful: 15,
    notHelpful: 0,
    size: "S",
    fit: "True to Size",
    images: [
      "/placeholder.svg?height=400&width=400&text=Styled+Look+1",
      "/placeholder.svg?height=400&width=400&text=Styled+Look+2",
      "/placeholder.svg?height=400&width=400&text=Detail+Shot",
    ],
  },
  {
    id: 4,
    customerName: "Taylor R.",
    rating: 3,
    title: "Good but not great",
    content:
      "The tee is nice and the quality seems good, but I was expecting something more special for the price point. It's a basic tee that does the job, but doesn't feel particularly premium. The fit is good though.",
    date: "2024-01-05",
    verified: true,
    helpful: 3,
    notHelpful: 7,
    size: "M",
    fit: "True to Size",
  },
  {
    id: 5,
    customerName: "Casey L.",
    rating: 5,
    title: "Worth every penny",
    content:
      "Initially hesitated because of the price, but after wearing this for a few weeks, I can say it's worth it. The fabric is incredibly soft and has maintained its shape and color after multiple washes. The cut is flattering and versatile.",
    date: "2024-01-02",
    verified: true,
    helpful: 9,
    notHelpful: 1,
    size: "L",
    fit: "True to Size",
    images: ["/placeholder.svg?height=400&width=400&text=After+Washing"],
  },
]