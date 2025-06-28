"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Search, ShoppingBag, Heart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MobileCartSheet } from "@/components/mobile-cart-sheet"
import { MobileSearchSheet } from "@/components/mobile-search-sheet"

import { useCart } from "@/hooks/use-cart.tsx"

export function MobileNavigation() {
  const { cartCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { name: "NEW ARRIVALS", href: "/new", badge: "HOT" },
    { name: "ESSENTIALS", href: "/essentials", badge: null },
    { name: "STREETWEAR", href: "/streetwear", badge: null },
    { name: "OUTERWEAR", href: "/outerwear", badge: null },
    { name: "BOTTOMS", href: "/bottoms", badge: null },
    { name: "ACCESSORIES", href: "/accessories", badge: null },
    { name: "LOOKBOOK", href: "/lookbook", badge: null },
    { name: "SALE", href: "/sale", badge: "50% OFF" },
  ]

  const accountItems = [
    { name: "MY ACCOUNT", href: "/account", icon: User },
    { name: "WISHLIST", href: "/wishlist", icon: Heart },
    { name: "ORDER HISTORY", href: "/orders", icon: ShoppingBag },
  ]

  return (
    <>
      <div className="sticky top-0 z-50 md:hidden">
        {/* Newsletter Banner */}
        <div className="bg-primary text-primary-foreground py-2 px-4 text-center">
          <p className="text-xs font-mono">
            <strong>BECOME AN AFFILIATE</strong> - Earn 15% commission
          </p>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="bg-background/95 backdrop-blur-md border-b">
          <div className="px-3 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-1">
              <div className="flex items-center space-x-0.5">
                <div className="w-3 h-3 bg-primary"></div>
                <div className="w-3 h-3 bg-background border border-primary"></div>
              </div>
              <span className="font-mono font-bold text-xs tracking-tight">INDECISIVE</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center space-x-1">
              <MobileSearchSheet>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10">
                  <Search className="h-4 w-4" />
                </Button>
              </MobileSearchSheet>

              <MobileCartSheet cartCount={cartCount}>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-accent/10">
                  <ShoppingBag className="h-4 w-4" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </MobileCartSheet>

              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full p-0 font-mono border-0 bg-background">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-primary"></div>
                        <div className="w-4 h-4 bg-background border border-primary"></div>
                      </div>
                      <span className="font-mono font-bold text-sm">INDECISIVE WEAR</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMenuOpen(false)}
                      className="h-8 w-8 hover:bg-accent/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Menu Content */}
                  <div className="flex flex-col h-full">
                    {/* Main Navigation */}
                    <div className="flex-1 px-4 py-6">
                      <div className="space-y-1">
                        {menuItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center justify-between py-3 text-sm font-medium hover:text-muted-foreground transition-colors group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                              {item.name}
                            </span>
                            {item.badge && (
                              <Badge className="bg-red-500 text-white text-xs px-2 py-1 border-0">{item.badge}</Badge>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Account Section */}
                    <div className="border-t px-4 py-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-muted-foreground">ACCOUNT</h3>
                      <div className="space-y-1">
                        {accountItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center space-x-3 py-2 text-sm font-medium hover:text-muted-foreground transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t px-4 py-4">
                      <div className="flex space-x-4 text-xs text-muted-foreground">
                        <Link href="/help" className="hover:text-foreground transition-colors">
                          HELP
                        </Link>
                        <Link href="/contact" className="hover:text-foreground transition-colors">
                          CONTACT
                        </Link>
                        <Link href="/about" className="hover:text-foreground transition-colors">
                          ABOUT
                        </Link>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 w-full bg-background/95 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-6 h-6 bg-primary"></div>
                <div className="w-6 h-6 bg-background border-2 border-primary"></div>
              </div>
              <span className="font-mono font-bold text-xl tracking-tight">INDECISIVE WEAR</span>
            </Link>

            <div className="flex items-center space-x-12">
              {["NEW ARRIVALS", "ESSENTIALS", "STREETWEAR", "LOOKBOOK"].map((item) => (
                <Link
                  key={item}
                  href={item === "LOOKBOOK" ? "/lookbook" : "#"}
                  className="text-sm font-mono font-medium hover:text-muted-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
              <Link
                href="/admin/social-automation"
                className="text-sm font-mono font-medium hover:text-muted-foreground transition-colors"
              >
                ADMIN
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <MobileSearchSheet>
                <Button variant="ghost" size="icon" className="hover:bg-accent/10 h-11 w-11">
                  <Search className="h-5 w-5" />
                </Button>
              </MobileSearchSheet>
              <MobileCartSheet cartCount={cartCount} />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}