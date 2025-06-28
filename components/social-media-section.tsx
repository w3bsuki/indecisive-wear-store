"use client"

import { SocialMediaFeed } from "@/components/social-media-feed"

export function SocialMediaSection() {
  return (
    <section className="py-6 md:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <SocialMediaFeed title="COMMUNITY STYLE" showHeader={true} maxPosts={8} />
      </div>
    </section>
  )
}
