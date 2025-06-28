"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, Clock } from "lucide-react"
import Image from "next/image"

interface SearchResult {
  id: number
  name: string
  price: number
  image: string
  category: string
}

interface MobileSearchSheetProps {
  children?: React.ReactNode
}

export function MobileSearchSheet({ children }: MobileSearchSheetProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches] = useState(["white tee", "bomber jacket", "cargo pants"])
  const [trendingSearches] = useState(["oversized hoodie", "minimal tee", "street pants"])

  const [searchResults] = useState<SearchResult[]>([
    {
      id: 1,
      name: "Essential White Tee",
      price: 45,
      image: "/placeholder.svg?height=100&width=100",
      category: "Essentials",
    },
    {
      id: 2,
      name: "Shadow Bomber",
      price: 120,
      image: "/placeholder.svg?height=100&width=100",
      category: "Outerwear",
    },
  ])

  const filteredResults =
    searchQuery.length > 0
      ? searchResults.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : []

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="hover:bg-black/5 h-11 w-11 sharp-active">
            <Search className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="top" className="w-full h-full font-mono p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-black/10">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="font-mono text-base h-12 border-2 border-black focus:ring-0 focus:border-black"
                autoFocus
              />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery.length === 0 ? (
            <div className="space-y-6">
              {/* Recent Searches */}
              <div>
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <Button
                      key={search}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(search)}
                      className="font-mono text-xs border border-black/20 hover:border-black"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Trending Searches */}
              <div>
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search) => (
                    <Button
                      key={search}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(search)}
                      className="font-mono text-xs border border-black/20 hover:border-black"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Results for "{searchQuery}" ({filteredResults.length})
              </h3>

              {filteredResults.length === 0 ? (
                <p className="text-black/60 text-sm">No products found</p>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-4 p-3 border border-black/10 hover:border-black/30 transition-colors"
                    >
                      <div className="w-16 h-16 relative flex-shrink-0">
                        <Image
                          src={result.image || "/placeholder.svg"}
                          alt={result.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-mono font-bold text-sm">{result.name}</h4>
                        <p className="text-xs text-black/60">{result.category}</p>
                        <p className="font-mono font-bold text-sm">${result.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
