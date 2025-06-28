"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Plus, Minus, X } from "lucide-react"
import { ReviewSummary } from "@/components/review-summary"

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  isNew?: boolean
  isBestSeller?: boolean
  rating: number
  reviews: number
  description?: string
  sizes?: string[]
  colors?: string[]
}

interface QuickViewDialogProps {
  product: Product
  isDark?: boolean
  children: React.ReactNode
}

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface QuickViewDialogProps {
  product: Product
  isDark?: boolean
  isOpen: boolean
  onClose: () => void
  onAddToCart: () => void
}

export function QuickViewDialog({ product, isDark = false, isOpen, onClose, onAddToCart }: QuickViewDialogProps) {
  const isMobile = useIsMobile()
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const sizes = product.sizes || ["XS", "S", "M", "L", "XL", "XXL"]
  const colors = product.colors || ["Black", "White", "Gray"]

  const handleAddToCart = () => {
    console.log("Added to cart:", { product, selectedSize, selectedColor, quantity })
    onAddToCart()
    onClose()
    // Show success toast here
  }

  const handleBuyNow = () => {
    console.log("Buying now:", { product, selectedSize, selectedColor, quantity })
    onClose()
    // Redirect to checkout here
  }

  const handleAddToWishlist = () => {
    console.log("Added to wishlist:", product)
    // Show success toast here
  }

  const Content = () => (
    <div className="h-full flex flex-col md:grid md:grid-cols-2 md:gap-6 md:h-auto">
      {/* Mobile: Header with image and basic info */}
      <div className="flex md:block gap-4 p-4 md:p-0">
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-24 h-24 md:w-full md:h-auto">
          <div className="h-full md:aspect-[4/5] relative overflow-hidden rounded-lg bg-secondary">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-contain p-2" />
            {product.isNew && (
              <Badge className="absolute top-1 left-1 md:top-2 md:left-2 bg-red-500 text-white font-mono text-[10px] md:text-xs px-1 md:px-2 py-1">NEW</Badge>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="flex-1 md:mt-4">
          <h2 className="text-lg md:text-2xl font-bold font-mono text-foreground">{product.name}</h2>
          <p className="text-muted-foreground text-xs md:text-sm">{product.category}</p>
          <span className="text-xl md:text-2xl font-bold font-mono text-foreground">${product.price}</span>
        </div>
      </div>

      {/* Product Options */}
      <div className="flex-1 px-4 md:p-0 overflow-y-auto">
        <div className="space-y-4 pb-20 md:pb-0">

          <div>
            <h4 className="font-bold mb-2 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Color</h4>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-2 min-h-[36px] min-w-[60px] border-2 text-xs font-mono transition-all flex-shrink-0 rounded-md ${
                    selectedColor === color
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Size</h4>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 px-3 min-h-[36px] min-w-[50px] border-2 text-xs font-mono font-medium transition-all flex-shrink-0 rounded-md ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Quantity</h4>
            <div className="flex items-center border-2 border-border w-fit rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 min-h-[36px] min-w-[36px] hover:bg-secondary"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 py-2 font-mono font-medium min-h-[36px] flex items-center min-w-[50px] text-center text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 min-h-[36px] min-w-[36px] hover:bg-secondary"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons - Mobile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="flex-1 border-2 border-primary hover:bg-primary hover:text-primary-foreground font-mono py-3 text-sm"
            disabled={!selectedSize || !selectedColor}
          >
            ADD ${(product.price * quantity).toFixed(2)}
          </Button>
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono py-3 text-sm"
            disabled={!selectedSize || !selectedColor}
          >
            BUY NOW
          </Button>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:block mt-auto pt-6">
        <div className="space-y-3">
          <Button
            onClick={handleBuyNow}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono py-4 text-base min-h-[56px]"
            disabled={!selectedSize || !selectedColor}
          >
            BUY NOW
          </Button>
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="w-full border-2 border-primary hover:bg-primary hover:text-primary-foreground font-mono py-4 text-base min-h-[56px]"
            disabled={!selectedSize || !selectedColor}
          >
            ADD TO CART - ${(product.price * quantity).toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] p-0 font-mono border-0 relative">
          <SheetTitle className="sr-only">Quick view: {product.name}</SheetTitle>
          <Content />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full max-h-screen m-0 p-0 font-mono overflow-hidden md:max-w-4xl md:h-auto md:max-h-[90vh] md:m-4 md:p-6 md:rounded-lg">
        <DialogTitle className="sr-only">Quick view: {product.name}</DialogTitle>
        <Content />
      </DialogContent>
    </Dialog>
  )
}
