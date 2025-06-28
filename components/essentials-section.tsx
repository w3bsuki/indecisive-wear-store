"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { medusaService, type MedusaProduct } from "@/lib/medusa"

export function EssentialsSection() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const medusaProducts = await medusaService.getProducts(4)
        setProducts(medusaProducts.slice(1)) // Get different products
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
    id: index + 7, // Different IDs for essentials
    medusaId: product.id,
    name: product.title,
    price: 35 + (index * 10), // Different pricing for essentials
    image: product.thumbnail || product.images[0]?.url || "/placeholder.svg?height=300&width=240",
    category: "Essentials",
    rating: 4.6 + (index * 0.1),
    reviews: 45 + (index * 15),
  }))
  
  return (
    <section className="py-6 md:py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 md:mb-8">
          <div>
            <h2 className="text-xl md:text-5xl font-bold tracking-tight mb-1">ESSENTIALS</h2>
            <p className="text-muted-foreground text-xs md:text-xl font-mono">Timeless pieces for every wardrobe</p>
          </div>
          <Button
            variant="outline"
            className="bg-accent/10 hover:bg-accent hover:text-accent-foreground font-mono text-xs md:text-base px-3 md:px-6"
          >
            VIEW ALL
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-[300px]"></div>
            ))
          ) : (
            transformedProducts.map((product) => (
              <ProductCard key={product.id} product={product} addToCart={addToCart} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}