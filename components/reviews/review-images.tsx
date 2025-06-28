"use client"

import React, { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { LazyImage } from "./lazy-image"

interface ReviewImagesProps {
  images: string[]
  reviewId: number
}

export const ReviewImages = React.memo(function ReviewImages({ images, reviewId }: ReviewImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!images || images.length === 0) return null

  return (
    <>
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <LazyImage
              key={`${reviewId}-${index}`}
              src={image || "/placeholder.svg"}
              alt={`Review photo ${index + 1}`}
              className="flex-shrink-0 w-20 h-20 object-cover cursor-pointer border border-black/10 hover:border-black/30 transition-colors"
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Review photo"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => setSelectedImage(null)}
              aria-label="Close image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})