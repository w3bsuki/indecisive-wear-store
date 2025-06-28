"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { medusaService, type MedusaProduct } from "@/lib/medusa"

export function FirstDropSection() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const medusaProducts = await medusaService.getProducts(8) // Get more products for grid
        setProducts(medusaProducts)
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
    id: index + 1,
    medusaId: product.id,
    name: product.title,
    price: 35 + (index * 5), // Starting at $35
    image: product.thumbnail || product.images[0]?.url || "/placeholder.svg?height=300&width=240",
    category: "Hat",
    rating: 4.8,
    reviews: 12 + (index * 3),
    isNew: index < 2, // Mark first 2 as new
  }))
  
  return (
    <section className="py-12 md:py-24 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight mb-4 font-mono">
            THE FIRST DROP
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 font-mono">
            Limited collection. Be among the first.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="font-mono text-base px-8 py-3"
          >
            VIEW ALL
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-square bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {transformedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}