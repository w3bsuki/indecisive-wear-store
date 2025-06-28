"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Star, Camera, Share2 } from "lucide-react"
import { SocialShare } from "@/components/social-share"

interface CustomerPhoto {
  id: number
  image: string
  customerName: string
  rating: number
  reviewTitle: string
  productName: string
  size: string
  verified: boolean
}

// Mock customer photos data
const customerPhotos: CustomerPhoto[] = [
  {
    id: 1,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+1",
    customerName: "Sarah M.",
    rating: 5,
    reviewTitle: "Perfect Essential Tee",
    productName: "Essential White Tee",
    size: "M",
    verified: true,
  },
  {
    id: 2,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+2",
    customerName: "Jordan P.",
    rating: 5,
    reviewTitle: "Minimalist perfection",
    productName: "Essential White Tee",
    size: "S",
    verified: true,
  },
  {
    id: 3,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+3",
    customerName: "Alex K.",
    rating: 4,
    reviewTitle: "Great quality, slightly oversized",
    productName: "Essential White Tee",
    size: "L",
    verified: true,
  },
  {
    id: 4,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+4",
    customerName: "Casey L.",
    rating: 5,
    reviewTitle: "Worth every penny",
    productName: "Essential White Tee",
    size: "L",
    verified: true,
  },
  {
    id: 5,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+5",
    customerName: "Taylor R.",
    rating: 4,
    reviewTitle: "Love the fit",
    productName: "Shadow Bomber",
    size: "M",
    verified: true,
  },
  {
    id: 6,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+6",
    customerName: "Morgan K.",
    rating: 5,
    reviewTitle: "Perfect for layering",
    productName: "Clean Lines Hoodie",
    size: "L",
    verified: true,
  },
  {
    id: 7,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+7",
    customerName: "Riley S.",
    rating: 5,
    reviewTitle: "Exactly what I wanted",
    productName: "Street Cargo Pants",
    size: "M",
    verified: true,
  },
  {
    id: 8,
    image: "/placeholder.svg?height=400&width=400&text=Customer+Photo+8",
    customerName: "Avery L.",
    rating: 4,
    reviewTitle: "Great streetwear piece",
    productName: "Urban Oversized Tee",
    size: "S",
    verified: true,
  },
]

interface CustomerPhotoGalleryProps {
  productId?: number
  title?: string
  showProductName?: boolean
}

export function CustomerPhotoGallery({
  productId,
  title = "Customer Photos",
  showProductName = false,
}: CustomerPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null)

  // Filter photos by product if productId is provided
  const filteredPhotos = productId ? customerPhotos : customerPhotos

  if (filteredPhotos.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Photo Grid - Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {filteredPhotos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative aspect-square overflow-hidden border border-black/10 hover:border-black/30 transition-colors flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
          >
            <img
              src={photo.image || "/placeholder.svg"}
              alt={`Photo by ${photo.customerName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < photo.rating ? "text-white fill-white" : "text-white/50 fill-white/50"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-white font-mono font-bold truncate">{photo.customerName}</p>
              {showProductName && <p className="text-xs text-white/80 font-mono truncate">{photo.productName}</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-full w-full h-full max-h-screen m-0 p-0 font-mono md:max-w-4xl md:h-auto md:max-h-[90vh] md:m-4 md:p-6">
            <div className="flex flex-col h-full md:grid md:grid-cols-2 md:gap-6 md:h-auto">
              {/* Image */}
              <div className="relative flex-shrink-0 h-[50vh] md:h-auto">
                <img
                  src={selectedPhoto.image || "/placeholder.svg"}
                  alt={`Photo by ${selectedPhoto.customerName}`}
                  className="w-full h-full object-cover md:object-contain"
                />

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white h-11 w-11"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col p-4 md:p-0 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedPhoto.rating ? "text-black fill-black" : "text-black/30 fill-black/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono font-bold text-sm">{selectedPhoto.customerName}</span>
                    {selectedPhoto.verified && (
                      <Badge className="bg-green-100 text-green-800 text-xs font-mono">VERIFIED</Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold mb-2">{selectedPhoto.reviewTitle}</h3>
                  {showProductName && <p className="text-sm text-black/60 mb-2">{selectedPhoto.productName}</p>}
                  <p className="text-sm font-mono">
                    Size: <strong>{selectedPhoto.size}</strong>
                  </p>
                </div>

                <div className="mt-auto space-y-3">
                  <Button className="w-full bg-black text-white hover:bg-black/80 font-mono min-h-[56px]">
                    SHOP THIS PRODUCT
                  </Button>

                  {/* Social Share Button */}
                  <SocialShare
                    image={selectedPhoto.image}
                    productName={selectedPhoto.productName}
                    customerName={selectedPhoto.customerName}
                    rating={selectedPhoto.rating}
                    reviewTitle={selectedPhoto.reviewTitle}
                    size={selectedPhoto.size}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-mono flex items-center gap-2 min-h-[56px]"
                    >
                      <Share2 className="h-4 w-4" />
                      SHARE TO SOCIAL MEDIA
                    </Button>
                  </SocialShare>
                </div>

                <div className="bg-gray-50 p-4 text-sm">
                  <h4 className="font-bold mb-2 uppercase tracking-wider">Share Your Photos</h4>
                  <p className="text-black/70 mb-3">
                    Show us how you style your Indecisive Wear pieces! Tag us @indecisivewear or use #IndecisiveStyle
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border border-black hover:bg-black hover:text-white font-mono text-xs min-h-[44px]"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    UPLOAD PHOTO
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
