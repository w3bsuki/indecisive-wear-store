"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, Upload, X, Camera, Share2, Check } from "lucide-react"
import { SocialShare } from "@/components/social-share"
import { socialAutomationService } from "@/lib/social-automation-service"
import type { Review } from "./types"

interface WriteReviewDialogProps {
  productName: string
  onReviewSubmit: (review: Review) => void
  children: React.ReactNode
}

export function WriteReviewDialog({ productName, onReviewSubmit, children }: WriteReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [size, setSize] = useState("")
  const [fit, setFit] = useState<"Runs Small" | "True to Size" | "Runs Large">("True to Size")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/") && uploadedImages.length < 5) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setUploadedImages((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }, [uploadedImages.length])

  const removeImage = useCallback((index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleImageUpload(e.dataTransfer.files)
  }, [handleImageUpload])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !title || !content || !customerName || !size) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newReview: Review = {
      id: Date.now(),
      customerName,
      rating,
      title,
      content,
      date: new Date().toISOString().split("T")[0],
      verified: false,
      helpful: 0,
      notHelpful: 0,
      size,
      fit,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
    }

    // Process review for social automation
    await socialAutomationService.processReview({
      id: newReview.id,
      customerName: newReview.customerName,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      productName: productName,
      productCategory: "Essentials", // This would come from product data in real implementation
      size: newReview.size,
      images: newReview.images,
      verified: newReview.verified,
      date: newReview.date,
    })

    onReviewSubmit(newReview)

    // Show success message with social sharing option
    setShowSuccessDialog(true)

    // Reset form
    setRating(0)
    setTitle("")
    setContent("")
    setCustomerName("")
    setSize("")
    setFit("True to Size")
    setUploadedImages([])
    setIsSubmitting(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl font-mono max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-wider">Write a Review</DialogTitle>
          <p className="text-sm text-black/60">Share your experience with {productName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Overall Rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= rating ? "text-black fill-black" : "text-black/30 hover:text-black/60"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Your Name *</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              className="font-mono"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Review Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="font-mono"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Your Review *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us about your experience with this product..."
              className="font-mono min-h-[120px]"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">
              Add Photos (Optional)
              <span className="text-xs font-normal text-black/60 ml-2">Up to 5 photos</span>
            </label>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed p-6 text-center transition-colors ${
                isDragging ? "border-black bg-black/5" : "border-black/30 hover:border-black/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="photo-upload"
                disabled={uploadedImages.length >= 5}
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer ${uploadedImages.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-black/60" />
                <p className="text-sm font-mono text-black/60">
                  {uploadedImages.length >= 5
                    ? "Maximum 5 photos reached"
                    : "Drag & drop photos here or click to browse"}
                </p>
                <p className="text-xs font-mono text-black/40 mt-1">JPG, PNG up to 10MB each</p>
              </label>
            </div>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 flex-wrap">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-20 h-20 object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Size and Fit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Size Purchased *</label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">How does it fit?</label>
              <Select value={fit} onValueChange={(value: any) => setFit(value)}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Runs Small">Runs Small</SelectItem>
                  <SelectItem value="True to Size">True to Size</SelectItem>
                  <SelectItem value="Runs Large">Runs Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 text-xs text-black/70">
            <h4 className="font-bold mb-2 uppercase tracking-wider">Photo Guidelines</h4>
            <ul className="space-y-1">
              <li>• Show the product being worn or styled</li>
              <li>• Include fit and detail shots</li>
              <li>• Use good lighting for clear images</li>
              <li>• Avoid inappropriate content</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || !title || !content || !customerName || !size}
              className="flex-1 bg-black text-white hover:bg-black/80 font-mono"
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
            </Button>
          </div>
        </form>
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 max-w-md mx-4 font-mono">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Review Submitted!</h3>
                <p className="text-sm text-black/70">
                  Thank you for sharing your experience. Your review helps other customers make better decisions.
                </p>

                {uploadedImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold">Want to share your photos?</p>
                    <SocialShare
                      image={uploadedImages[0]}
                      productName={productName}
                      customerName={customerName}
                      rating={rating}
                      reviewTitle={title}
                      size={size}
                    >
                      <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-mono flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        SHARE TO SOCIAL MEDIA
                      </Button>
                    </SocialShare>
                  </div>
                )}

                <Button
                  onClick={() => setShowSuccessDialog(false)}
                  variant="outline"
                  className="w-full border-2 border-black hover:bg-black hover:text-white font-mono"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}