"use client"

import Image from "next/image"
import { Heart, Plus, Eye, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuickViewDialog } from "@/components/quick-view-dialog"
import { ReviewSummary } from "@/components/review-summary"
import { useState } from "react"

// Define the shape of the product object for type safety
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  rating: number;
  reviews: number;
}

interface ProductCardProps {
  product: Product;
  isDark?: boolean;
  addToCart: (product: Product) => void; // Accept addToCart as a prop
}

import { useCart } from "@/hooks/use-cart.tsx"

export function ProductCard({ product, isDark = false }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  
  return (
    <div className="group relative">
      <div 
        className="aspect-square w-full overflow-hidden rounded-lg bg-secondary relative group/image cursor-pointer"
        onClick={() => setIsQuickViewOpen(true)}
      >
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          width={200}
          height={200}
          className="w-full h-full object-contain p-4"
        />

        {/* Wishlist Icon - Top Right */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all duration-200 ${
            isWishlisted ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            setIsWishlisted(!isWishlisted)
          }}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </Button>


        {/* NEW Badge */}
        {product.isNew && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white font-mono text-[10px] px-2 py-1 border-0">
            NEW
          </Badge>
        )}
      </div>

      <div className="mt-4 text-left space-y-2">
        <h3 className={`text-sm font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-foreground'}`}>
          {product.name}
        </h3>
        <p className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>
          {product.category}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className={`text-lg font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-foreground'}`}>
            ${product.price}
          </p>
          <Button 
            onClick={() => addToCart(product)}
            size="sm" 
            className="font-mono text-xs px-2 md:px-3 h-8"
            variant={isDark ? "secondary" : "default"}
          >
            <ShoppingCart className="h-4 w-4 md:h-3 md:w-3 md:mr-1" />
            <span className="hidden md:inline font-mono">Add</span>
          </Button>
        </div>
      </div>

      {/* Quick View Dialog */}
      <QuickViewDialog
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={() => addToCart(product)}
      />
    </div>
  )
}
