"use client"

import Image from "next/image"

const categories = [
  { name: "NEW ARRIVALS", image: "https://placehold.co/400x500/000000/000000", count: "24 items", isDark: true },
  { name: "ESSENTIALS", image: "https://placehold.co/400x500/FFFFFF/FFFFFF", count: "18 items", isDark: false },
  { name: "STREETWEAR", image: "https://placehold.co/400x500/000000/000000", count: "32 items", isDark: true },
  { name: "OUTERWEAR", image: "https://placehold.co/400x500/FFFFFF/FFFFFF", count: "12 items", isDark: false },
  { name: "BOTTOMS", image: "https://placehold.co/400x500/000000/000000", count: "16 items", isDark: true },
  { name: "ACCESSORIES", image: "https://placehold.co/400x500/FFFFFF/FFFFFF", count: "8 items", isDark: false },
]

export function CategorySection() {
  return (
    <section className="py-6 md:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-8 md:mb-12 text-center text-foreground">SHOP BY CATEGORY</h2>
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <div key={category.name} className="min-w-[160px] sm:min-w-[200px] md:min-w-[240px] cursor-pointer">
              <div className={`relative overflow-hidden rounded-lg border ${category.isDark ? 'border-primary' : 'border-border'}`}>
                <div className="aspect-[4/5] relative">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, 240px"
                    className="object-cover"
                  />
                  <div className={`absolute inset-0 flex flex-col justify-end p-4 md:p-6 ${category.isDark ? 'bg-primary/80' : 'bg-background/80'}`}>
                    <h3 className={`font-bold text-sm sm:text-base md:text-lg leading-tight ${category.isDark ? 'text-primary-foreground' : 'text-primary'}`}>
                      {category.name}
                    </h3>
                    <p className={`text-sm font-mono mt-1 ${category.isDark ? 'text-muted' : 'text-muted-foreground'}`}>{category.count}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
