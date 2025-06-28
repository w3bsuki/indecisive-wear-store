"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background border-t py-8 md:py-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4 md:mb-8">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-primary"></div>
                <div className="w-4 h-4 bg-background border-2 border-primary"></div>
              </div>
              <span className="font-mono font-bold text-sm">INDECISIVE WEAR</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For the beautifully undecided. Embrace both sides of your style.
            </p>
          </div>

          {[
            { title: "SHOP", links: ["New Arrivals", "Essentials", "Streetwear", "Sale"] },
            { title: "SUPPORT", links: ["Size Guide", "Shipping", "Returns", "Contact"] },
            { title: "CONNECT", links: ["Instagram", "Twitter", "TikTok", "Newsletter"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-mono font-bold mb-4 md:mb-8 text-sm uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2 md:space-y-4 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="hover:text-foreground">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-8 md:mt-16 pt-6 text-center text-xs sm:text-base text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Indecisive Wear. All rights reserved. | Privacy Policy | Terms of
            Service
          </p>
        </div>
      </div>
    </footer>
  )
}
