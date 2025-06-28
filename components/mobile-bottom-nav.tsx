"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Heart, ShoppingBag, Filter, Search, Home } from "lucide-react"
import { MobileCartSheet } from "@/components/mobile-cart-sheet"
import { MobileSearchSheet } from "@/components/mobile-search-sheet"

import { useCart } from "@/hooks/use-cart.tsx"

interface MobileBottomNavProps {
  wishlistCount?: number
}

export function MobileBottomNav({ wishlistCount = 3 }: MobileBottomNavProps) {
  const { cartCount } = useCart()
  const [isVisible, setIsVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Show bottom nav when scrolled past hero (assuming hero is 100vh)
      const heroHeight = window.innerHeight
      setIsVisible(window.scrollY > heroHeight * 0.8)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/10 z-40 md:hidden">
      <div className="flex items-center justify-around py-2 px-4 pb-safe">
        {/* Home */}
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollToTop}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-black/5"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-mono">HOME</span>
        </Button>

        {/* Search */}
        <MobileSearchSheet>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-black/5"
          >
            <Search className="h-5 w-5" />
            <span className="text-xs font-mono">SEARCH</span>
          </Button>
        </MobileSearchSheet>

        {/* Filters */}
        <FiltersSheet activeFilters={activeFilters} setActiveFilters={setActiveFilters}>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-black/5 relative"
          >
            <Filter className="h-5 w-5" />
            <span className="text-xs font-mono">FILTERS</span>
            {activeFilters > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </FiltersSheet>

        {/* Wishlist */}
        <WishlistSheet wishlistCount={wishlistCount}>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-black/5 relative"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs font-mono">WISHLIST</span>
            {wishlistCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                {wishlistCount}
              </Badge>
            )}
          </Button>
        </WishlistSheet>

        {/* Cart */}
        <MobileCartSheet cartCount={cartCount}>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-black/5 relative"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs font-mono">CART</span>
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                {cartCount}
              </Badge>
            )}
          </Button>
        </MobileCartSheet>
      </div>
    </div>
  )
}

function FiltersSheet({
  children,
  activeFilters,
  setActiveFilters,
}: {
  children: React.ReactNode
  activeFilters: number
  setActiveFilters: (count: number) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [sortBy, setSortBy] = useState("")

  const categories = ["Essentials", "Streetwear", "Outerwear", "Bottoms", "Accessories"]
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]
  const colors = ["Black", "White", "Gray", "Navy", "Beige"]
  const priceRanges = ["Under $50", "$50-$100", "$100-$150", "Over $150"]
  const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Most Popular", "Best Rated"]

  const applyFilters = () => {
    let count = 0
    if (selectedCategory) count++
    if (selectedSize) count++
    if (selectedColor) count++
    if (priceRange) count++
    setActiveFilters(count)
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSelectedSize("")
    setSelectedColor("")
    setPriceRange("")
    setSortBy("")
    setActiveFilters(0)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] font-mono p-0">
        <SheetHeader className="p-6 border-b border-black/10">
          <SheetTitle className="text-xl font-bold uppercase tracking-wider">FILTERS & SORT</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sort */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">SORT BY</h3>
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <label key={option} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="sort"
                    value={option}
                    checked={sortBy === option}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-mono">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">CATEGORY</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
                  className={`px-4 py-2 text-sm font-mono border transition-colors ${
                    selectedCategory === category
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black/20 hover:border-black"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">SIZE</h3>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                  className={`py-3 text-sm font-mono border transition-colors ${
                    selectedSize === size
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black/20 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">COLOR</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                  className={`px-4 py-2 text-sm font-mono border transition-colors ${
                    selectedColor === color
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black/20 hover:border-black"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">PRICE RANGE</h3>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <label key={range} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="price"
                    value={range}
                    checked={priceRange === range}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-mono">{range}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-black/10 p-6 space-y-3 pb-safe">
          <Button
            onClick={applyFilters}
            className="w-full bg-black text-white hover:bg-black/80 font-mono py-4 text-base"
          >
            APPLY FILTERS
          </Button>
          <Button
            onClick={clearFilters}
            variant="outline"
            className="w-full border-2 border-black hover:bg-black hover:text-white font-mono py-4 text-base"
          >
            CLEAR ALL
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function WishlistSheet({ children, wishlistCount }: { children: React.ReactNode; wishlistCount: number }) {
  const wishlistItems = [
    {
      id: 1,
      name: "Essential White Tee",
      price: 45,
      image: "/placeholder.svg?height=200&width=200",
      inStock: true,
    },
    {
      id: 2,
      name: "Shadow Bomber",
      price: 120,
      image: "/placeholder.svg?height=200&width=200",
      inStock: true,
    },
    {
      id: 3,
      name: "Clean Lines Hoodie",
      price: 85,
      image: "/placeholder.svg?height=200&width=200",
      inStock: false,
    },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm font-mono p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-black/10">
          <SheetTitle className="text-xl font-bold uppercase tracking-wider">WISHLIST ({wishlistCount})</SheetTitle>
        </SheetHeader>

        {wishlistItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-black/30" />
              <p className="text-black/60 font-mono">Your wishlist is empty</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-black/10">
                <div className="w-20 h-20 relative flex-shrink-0">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-mono font-bold text-sm">{item.name}</h4>
                    <p className="font-mono font-bold text-sm">${item.price}</p>
                    <p className={`text-xs ${item.inStock ? "text-green-600" : "text-red-600"}`}>
                      {item.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!item.inStock}
                      className="flex-1 bg-black text-white hover:bg-black/80 font-mono text-xs py-2 h-8"
                    >
                      ADD TO CART
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 border border-black/20 hover:border-black font-mono text-xs py-2 h-8"
                    >
                      <Heart className="h-3 w-3 fill-current" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-black/10 p-6 pb-safe">
          <Button className="w-full bg-black text-white hover:bg-black/80 font-mono py-4 text-base">
            VIEW ALL WISHLIST
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
