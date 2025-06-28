"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSection() {
  return (
    <section className="min-h-[300px] md:h-96 flex relative mb-16 md:mb-0">
      <div className="w-1/2 bg-background flex flex-col justify-center items-center px-3 sm:px-6 md:px-12 py-8 md:py-0">
        <div className="text-center space-y-3 sm:space-y-6 md:space-y-8 max-w-xs sm:max-w-sm md:max-w-md w-full">
          <h3 className="text-lg sm:text-3xl md:text-4xl font-bold">STAY MINIMAL</h3>
          <p className="text-muted-foreground text-xs sm:text-base md:text-lg">Get updates on our essential pieces</p>
          <div className="flex flex-col gap-2 sm:gap-4">
            <Input
              placeholder="Enter email"
              className="font-mono bg-accent/10 focus:bg-accent/20 focus:ring-0 text-xs sm:text-base md:text-lg px-3"
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs sm:text-base md:text-lg py-3">
              SUBSCRIBE
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-px"></div>

      <div className="w-1/2 bg-primary flex flex-col justify-center items-center px-3 sm:px-6 md:px-12 py-8 md:py-0">
        <div className="text-center space-y-3 sm:space-y-6 md:space-y-8 max-w-xs sm:max-w-sm md:max-w-md w-full">
          <h3 className="text-lg sm:text-3xl md:text-4xl font-bold text-primary-foreground">JOIN COMMUNITY</h3>
          <p className="text-muted-foreground text-xs sm:text-base md:text-lg">Share your style and get featured</p>
          <div className="flex flex-col gap-2 sm:gap-4">
            <Input
              placeholder="Enter email"
              className="font-mono bg-primary-foreground/10 text-primary-foreground placeholder:text-muted-foreground focus:bg-primary-foreground/20 focus:ring-0 text-xs sm:text-base md:text-lg px-3"
            />
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-mono text-xs sm:text-base md:text-lg py-3">
              JOIN NOW
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
