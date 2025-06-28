"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Heart, Star, Plus, Minus, Share2, Truck, RotateCcw, Shield } from "lucide-react"
import { ReviewsSection } from "@/components/reviews-section"
import { CustomerPhotoGallery } from "@/components/customer-photo-gallery"

// This would normally come from your database/API
const getProduct = (id: string) => {
  const products = {
    "1": {
      id: 1,
      name: "Essential White Tee",
      price: 45,
      originalPrice: 60,
      images: [
        "/placeholder.svg?height=800&width=600&text=White+Tee+Front",
        "/placeholder.svg?height=800&width=600&text=White+Tee+Back",
        "/placeholder.svg?height=800&width=600&text=White+Tee+Detail",
        "/placeholder.svg?height=800&width=600&text=White+Tee+Styled",
      ],
      category: "Essentials",
      isNew: true,
      rating: 4.8,
      reviews: 124,
      description:
        "Our signature essential tee crafted from premium organic cotton. Cut for a relaxed fit with clean lines that embody minimalist perfection. This piece forms the foundation of any indecisive wardrobe.",
      features: [
        "100% Organic Cotton",
        "Pre-shrunk for consistent fit",
        "Reinforced shoulder seams",
        "Side-seamed construction",
        "Tear-away label for comfort",
      ],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["White", "Black", "Gray"],
      inStock: true,
      stockCount: 15,
    },
  }

  return products[id as keyof typeof products] || null
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return (
      <div className="min-h-screen bg-white font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">PRODUCT NOT FOUND</h1>
          <Link href="/">
            <Button className="bg-black text-white hover:bg-black/80 font-mono">RETURN TO STORE</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    console.log("Added to cart:", { product, selectedSize, selectedColor, quantity })
  }

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Navigation */}
      <nav className="border-b border-black/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-mono font-medium">BACK TO STORE</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] relative overflow-hidden">
              <Image
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.isNew && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white font-mono text-xs px-2 py-1">NEW</Badge>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative overflow-hidden border-2 transition-all ${
                    selectedImage === index ? "border-black" : "border-black/20 hover:border-black/40"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating) ? "text-black fill-black" : "text-black/30 fill-black/30"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-black/60 ml-1">({product.reviews} reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-black/60 text-sm mb-4 uppercase tracking-wider">{product.category}</p>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-black/40 line-through">${product.originalPrice}</span>
                )}
                {product.originalPrice && (
                  <Badge className="bg-red-500 text-white font-mono text-xs">
                    SAVE ${product.originalPrice - product.price}
                  </Badge>
                )}
              </div>

              {product.inStock ? (
                <p className="text-sm text-green-600 font-mono">✓ IN STOCK ({product.stockCount} remaining)</p>
              ) : (
                <p className="text-sm text-red-600 font-mono">✗ OUT OF STOCK</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-base leading-relaxed text-black/80">{product.description}</p>
            </div>

            <Separator />

            {/* Color Selection */}
            <div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">Color</h3>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border-2 text-sm font-mono transition-all ${
                      selectedColor === color
                        ? "border-black bg-black text-white"
                        : "border-black/20 hover:border-black"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider">Size</h3>
                <button className="text-sm underline hover:no-underline">Size Guide</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 border-2 text-sm font-mono font-medium transition-all ${
                      selectedSize === size ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-black">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-black/5">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 py-3 font-mono font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-black/5">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-black text-white hover:bg-black/80 font-mono py-4 text-base"
                disabled={!selectedSize || !selectedColor || !product.inStock}
              >
                {product.inStock ? `ADD TO CART - $${(product.price * quantity).toFixed(2)}` : "OUT OF STOCK"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-2 border-black hover:bg-black hover:text-white font-mono py-4 text-base"
              >
                <Heart className="h-4 w-4 mr-2" />
                ADD TO WISHLIST
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-black/10">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-mono">FREE SHIPPING</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-mono">30 DAY RETURNS</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-mono">2 YEAR WARRANTY</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Photos Section */}
        <div className="mt-16 md:mt-24">
          <CustomerPhotoGallery productId={product.id} />
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16 md:mt-24">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 font-mono">
              <TabsTrigger value="details">DETAILS</TabsTrigger>
              <TabsTrigger value="reviews">REVIEWS ({product.reviews})</TabsTrigger>
              <TabsTrigger value="photos">PHOTOS</TabsTrigger>
              <TabsTrigger value="shipping">SHIPPING</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold mb-4 text-lg uppercase tracking-wider">Product Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="text-black/80 font-mono text-sm">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-4 text-lg uppercase tracking-wider">Care Instructions</h3>
                  <ul className="space-y-2 text-black/80 font-mono text-sm">
                    <li>• Machine wash cold with like colors</li>
                    <li>• Do not bleach</li>
                    <li>• Tumble dry low</li>
                    <li>• Iron on low heat if needed</li>
                    <li>• Do not dry clean</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <ReviewsSection
                productId={product.id}
                productName={product.name}
                averageRating={product.rating}
                totalReviews={product.reviews}
              />
            </TabsContent>

            <TabsContent value="photos" className="mt-8">
              <CustomerPhotoGallery productId={product.id} title="All Customer Photos" />
            </TabsContent>

            <TabsContent value="shipping" className="mt-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold mb-4 text-lg uppercase tracking-wider">Shipping Information</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-mono font-bold mb-2">FREE STANDARD SHIPPING</h4>
                      <p className="text-black/80">5-7 business days • Orders over $50</p>
                    </div>
                    <div>
                      <h4 className="font-mono font-bold mb-2">EXPRESS SHIPPING - $15</h4>
                      <p className="text-black/80">2-3 business days</p>
                    </div>
                    <div>
                      <h4 className="font-mono font-bold mb-2">OVERNIGHT SHIPPING - $25</h4>
                      <p className="text-black/80">Next business day</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
