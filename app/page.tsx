"use client"

import { useState } from "react"
import { CategorySection } from "@/components/category-section"
import { BestSellersSection } from "@/components/best-sellers-section"
import { EssentialsSection } from "@/components/essentials-section"
import { StreetwearSection } from "@/components/streetwear-section"
import { FirstDropSection } from "@/components/first-drop-section"
import { Badge } from "@/components/ui/badge"
import { NewsletterSection } from "@/components/newsletter-section"
import { Footer } from "@/components/footer"
import { ReviewSummary } from "@/components/review-summary"
import { MobileNavigation } from "@/components/mobile-navigation"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { SocialMediaSection } from "@/components/social-media-section"

import { InteractiveHero } from "@/components/interactive-hero"

import { useCart } from "@/hooks/use-cart.tsx"

export default function IndecisiveWearStore() {
  const { addToCart } = useCart()

  

  

  

  

  

  

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Enhanced Mobile Navigation */}
      <MobileNavigation />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav wishlistCount={3} />

      {/* Hero Section */}
      <InteractiveHero />

      {/* Marquee Section */}
      <section className="bg-primary text-primary-foreground py-2 sm:py-4 md:py-5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex">
              <span className="text-xs sm:text-base md:text-lg lg:text-xl font-mono font-bold tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] mx-3 sm:mx-6 md:mx-8">
                INDECISIVE WEAR
              </span>
              <span className="text-xs sm:text-base md:text-lg lg:text-xl font-mono font-bold tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] mx-3 sm:mx-6 md:mx-8">
                CHOOSE BOTH SIDES
              </span>
              <span className="text-xs sm:text-base md:text-lg lg:text-xl font-mono font-bold tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] mx-3 sm:mx-6 md:mx-8">
                MINIMAL + MAXIMAL
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* The First Drop Section */}
      <FirstDropSection />

      {/* Categories Section - Hidden for now */}
      {/* <CategorySection /> */}

      {/* Best Sellers Section - Hidden for now */}
      {/* <BestSellersSection /> */}

      {/* Essentials Section - Hidden for now */}
      {/* <EssentialsSection /> */}

      {/* Streetwear Section - Hidden for now */}
      {/* <StreetwearSection /> */}

      {/* Social Media Section */}
      <SocialMediaSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
