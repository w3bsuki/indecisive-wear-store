"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Share2, Instagram, Twitter, Facebook, Copy, Download, Check, Hash, AtSign } from "lucide-react"

interface SocialShareProps {
  image: string
  productName: string
  customerName: string
  rating: number
  reviewTitle: string
  size?: string
  children: React.ReactNode
}

export function SocialShare({
  image,
  productName,
  customerName,
  rating,
  reviewTitle,
  size,
  children,
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customCaption, setCustomCaption] = useState("")
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  // Generate default captions for different platforms
  const generateCaption = (platform: "instagram" | "twitter" | "facebook") => {
    const stars = "⭐".repeat(rating)
    const baseCaption = `Just got my ${productName} from @indecisivewear and I'm obsessed! ${stars}`

    const hashtags = [
      "#IndecisiveWear",
      "#IndecisiveStyle",
      "#MinimalistFashion",
      "#StreetStyle",
      "#OOTD",
      "#CustomerReview",
    ]

    const sizeInfo = size ? ` (Size: ${size})` : ""

    switch (platform) {
      case "instagram":
        return `${baseCaption}${sizeInfo}\n\n"${reviewTitle}"\n\n${hashtags.join(" ")}\n\n#ad #sponsored`
      case "twitter":
        return `${baseCaption}${sizeInfo} "${reviewTitle}" ${hashtags.slice(0, 3).join(" ")}`
      case "facebook":
        return `${baseCaption}${sizeInfo}\n\n"${reviewTitle}"\n\nCheck out @IndecisiveWear for minimalist pieces that actually make decisions easier! 🖤🤍`
      default:
        return baseCaption
    }
  }

  const shareToInstagram = () => {
    const caption = customCaption || generateCaption("instagram")
    // Instagram doesn't support direct sharing with custom text, so we copy the caption
    navigator.clipboard.writeText(caption)
    // Open Instagram (mobile) or Instagram web
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.open("instagram://camera", "_blank")
    } else {
      window.open("https://www.instagram.com/", "_blank")
    }
  }

  const shareToTwitter = () => {
    const caption = customCaption || generateCaption("twitter")
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`
    window.open(url, "_blank", "width=550,height=420")
  }

  const shareToFacebook = () => {
    const caption = customCaption || generateCaption("facebook")
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(caption)}`
    window.open(url, "_blank", "width=550,height=420")
  }

  const copyToClipboard = async () => {
    const caption = customCaption || generateCaption("instagram")
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const downloadImage = async () => {
    try {
      const response = await fetch(image)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `indecisive-wear-${productName.toLowerCase().replace(/\s+/g, "-")}-review.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch (err) {
      console.error("Failed to download image: ", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl font-mono">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Style
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden border">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${productName} review`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">{productName}</h3>
                <p className="text-sm text-black/70">"{reviewTitle}"</p>
                <div className="flex items-center gap-2 text-xs">
                  <span>⭐ {rating}/5</span>
                  {size && <span>• Size {size}</span>}
                  <span>• by {customerName}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider">
                  Custom Caption (Optional)
                </label>
                <Textarea
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  placeholder="Write your own caption or use our suggested ones..."
                  className="font-mono min-h-[120px] text-sm"
                />
                <p className="text-xs text-black/60 mt-1">Leave blank to use platform-specific suggestions</p>
              </div>

              <div className="bg-gray-50 p-4 space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Suggested Hashtags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "#IndecisiveWear",
                    "#IndecisiveStyle",
                    "#MinimalistFashion",
                    "#StreetStyle",
                    "#OOTD",
                    "#CustomerReview",
                  ].map((hashtag) => (
                    <Badge key={hashtag} variant="outline" className="text-xs font-mono">
                      {hashtag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-black/60">
                  <AtSign className="h-3 w-3 inline mr-1" />
                  Don't forget to tag @indecisivewear
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Media Buttons */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider">Share To</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={shareToInstagram}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90 font-mono flex items-center gap-2"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Button>

              <Button
                onClick={shareToTwitter}
                className="bg-black text-white hover:bg-gray-800 font-mono flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>

              <Button
                onClick={shareToFacebook}
                className="bg-blue-600 text-white hover:bg-blue-700 font-mono flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white font-mono flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Caption"}
              </Button>

              <Button
                onClick={downloadImage}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white font-mono flex items-center gap-2"
              >
                {downloaded ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {downloaded ? "Downloaded!" : "Download Image"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Tips */}
          <div className="bg-blue-50 p-4 space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-blue-800">Sharing Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Tag @indecisivewear for a chance to be featured</li>
              <li>• Use #IndecisiveStyle to join our community</li>
              <li>• Share your styling tips in the caption</li>
              <li>• Include your size for other shoppers</li>
              <li>• Show different angles and styling options</li>
            </ul>
          </div>

          {/* Incentive */}
          <div className="bg-black text-white p-4 text-center">
            <h4 className="font-bold mb-2 uppercase tracking-wider">Get Featured!</h4>
            <p className="text-sm text-white/80 mb-3">
              Share your photo and get a chance to be featured on our website and social media
            </p>
            <Badge className="bg-yellow-500 text-black font-mono">
              Featured customers get 20% off their next order
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
