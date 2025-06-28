"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LookbookPage() {
  const lookbookItems = [
    {
      id: 1,
      title: "MINIMAL MONDAYS",
      description: "Clean lines meet comfort in our essential pieces",
      image: "/placeholder.svg?height=800&width=600&text=Minimal+Look",
      products: ["Essential White Tee", "Clean Lines Hoodie", "Pure Form Joggers"],
    },
    {
      id: 2,
      title: "STREET STATEMENTS",
      description: "Bold pieces that speak without saying a word",
      image: "/placeholder.svg?height=800&width=600&text=Street+Look",
      products: ["Shadow Bomber", "Street Cargo Pants", "Urban Oversized Tee"],
    },
    {
      id: 3,
      title: "CONTRAST CULTURE",
      description: "When opposites attract - mixing minimal with maximal",
      image: "/placeholder.svg?height=800&width=600&text=Contrast+Look",
      products: ["Night Rider Hoodie", "Essential White Tee", "Utility Vest"],
    },
    {
      id: 4,
      title: "LAYERED LUXURY",
      description: "Sophisticated layering for the indecisive dresser",
      image: "/placeholder.svg?height=800&width=600&text=Layered+Look",
      products: ["Clean Lines Hoodie", "Shadow Bomber", "Minimal Crew Neck"],
    },
    {
      id: 5,
      title: "URBAN ESSENTIALS",
      description: "City-ready pieces that transition from day to night",
      image: "/placeholder.svg?height=800&width=600&text=Urban+Look",
      products: ["Graphic Statement Tee", "Street Cargo Pants", "Shadow Bomber"],
    },
    {
      id: 6,
      title: "MONOCHROME MAGIC",
      description: "The power of black and white in perfect harmony",
      image: "/placeholder.svg?height=800&width=600&text=Monochrome+Look",
      products: ["Essential White Tee", "Night Rider Hoodie", "Pure Form Joggers"],
    },
  ]

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header */}
      <header className="border-b-2 border-black py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-mono font-medium">BACK TO STORE</span>
            </Link>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">LOOKBOOK</h1>
              <p className="text-black/60 text-sm md:text-base mt-1">Style inspiration for the indecisive</p>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            STYLE WITHOUT
            <br />
            COMPROMISE
          </h2>
          <p className="text-lg md:text-xl text-black/70 leading-relaxed">
            Discover how to style our pieces for every mood, every moment, every side of your personality.
          </p>
        </div>
      </section>

      {/* Lookbook Grid */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {lookbookItems.map((item, index) => (
              <div key={item.id} className={`group ${index % 2 === 1 ? "md:mt-16" : ""}`}>
                <div className="relative overflow-hidden mb-6">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-black/70 text-sm md:text-base leading-relaxed">{item.description}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Featured Products:</h4>
                    <ul className="space-y-1">
                      {item.products.map((product) => (
                        <li key={product} className="text-sm text-black/60 font-mono">
                          • {product}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    className="border-2 border-black hover:bg-black hover:text-white font-mono text-sm"
                  >
                    SHOP THIS LOOK
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">STILL INDECISIVE?</h2>
          <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
            Let our style experts help you curate the perfect wardrobe for your dual personality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-black hover:bg-white/90 font-mono px-8 py-3">BOOK STYLING SESSION</Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-black font-mono px-8 py-3"
            >
              TAKE STYLE QUIZ
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
