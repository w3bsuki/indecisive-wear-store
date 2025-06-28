"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { medusaService, type MedusaProduct } from "@/lib/medusa"

export function StreetwearSection() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const medusaProducts = await medusaService.getProducts(4)
        // Get different products by taking a slice from the middle
        setProducts(medusaProducts.slice(2, 6))
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Transform Medusa products to match ProductCard interface
  const transformedProducts = products.map((product, index) => ({
    id: index + 11, // Different IDs for streetwear
    medusaId: product.id,
    name: product.title,
    price: 25 + (index * 15), // Different pricing for streetwear
    image: product.thumbnail || product.images[0]?.url || "/placeholder.svg?height=300&width=240",
    category: "Streetwear",
    rating: 4.4 + (index * 0.1),
    reviews: 60 + (index * 25),
  }))
  
  return (
    <section className="py-6 md:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 md:mb-8">
          <div>
            <h2 className="text-xl md:text-5xl font-bold tracking-tight mb-1">STREETWEAR</h2>
            <p className="text-muted-foreground text-xs md:text-xl font-mono">Urban pieces for the bold</p>
          </div>
          <Button
            variant="outline"
            className="bg-accent/10 hover:bg-accent hover:text-accent-foreground font-mono text-xs md:text-base px-3 md:px-6"
          >
            VIEW ALL
          </Button>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-w-[180px] sm:min-w-[220px] md:min-w-[280px]">
                <div className="bg-gray-200 animate-pulse rounded-lg h-[300px]"></div>
              </div>
            ))
          ) : (
            transformedProducts.map((product) => (
              <div key={product.id} className="min-w-[180px] sm:min-w-[220px] md:min-w-[280px]">
                <ProductCard product={product} addToCart={addToCart} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
