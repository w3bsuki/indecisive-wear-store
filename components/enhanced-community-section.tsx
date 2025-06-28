"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Heart, MessageCircle, Share2, Instagram, Twitter, Camera, X, Star, Play } from "lucide-react"

interface CommunityPost {
  id: number
  type: "photo" | "video" | "story"
  image: string
  video?: string
  customerName: string
  username: string
  platform: "instagram" | "twitter" | "tiktok"
  caption: string
  likes: number
  comments: number
  productName: string
  hashtags: string[]
  verified: boolean
  featured: boolean
}

const communityPosts: CommunityPost[] = [
  {
    id: 1,
    type: "photo",
    image: "/placeholder.svg?height=400&width=400&text=Street+Style+1",
    customerName: "Sarah Chen",
    username: "@sarahstyles",
    platform: "instagram",
    caption: "Obsessed with this minimalist vibe ✨ The Essential White Tee is everything!",
    likes: 1247,
    comments: 89,
    productName: "Essential White Tee",
    hashtags: ["#IndecisiveWear", "#MinimalStyle", "#OOTD"],
    verified: true,
    featured: true,
  },
  {
    id: 2,
    type: "video",
    image: "/placeholder.svg?height=400&width=400&text=Styling+Video",
    video: "/placeholder-video.mp4",
    customerName: "Jordan Kim",
    username: "@jordanminimal",
    platform: "tiktok",
    caption: "3 ways to style the Shadow Bomber 🔥",
    likes: 3421,
    comments: 156,
    productName: "Shadow Bomber",
    hashtags: ["#IndecisiveWear", "#StyleTips", "#StreetWear"],
    verified: false,
    featured: true,
  },
  {
    id: 3,
    type: "photo",
    image: "/placeholder.svg?height=400&width=400&text=Layered+Look",
    customerName: "Alex Rivera",
    username: "@alexurban",
    platform: "instagram",
    caption: "Perfect layering piece for the city 🏙️",
    likes: 892,
    comments: 34,
    productName: "Clean Lines Hoodie",
    hashtags: ["#IndecisiveWear", "#Layering", "#UrbanStyle"],
    verified: false,
    featured: false,
  },
  {
    id: 4,
    type: "photo",
    image: "/placeholder.svg?height=400&width=400&text=Cargo+Fit",
    customerName: "Taylor Brooks",
    username: "@taylorfit",
    platform: "instagram",
    caption: "These cargo pants are a game changer! Perfect fit 👌",
    likes: 567,
    comments: 23,
    productName: "Street Cargo Pants",
    hashtags: ["#IndecisiveWear", "#CargoStyle", "#PerfectFit"],
    verified: true,
    featured: false,
  },
  {
    id: 5,
    type: "story",
    image: "/placeholder.svg?height=400&width=400&text=Behind+Scenes",
    customerName: "Morgan Lee",
    username: "@morganstyle",
    platform: "instagram",
    caption: "Behind the scenes of my photoshoot wearing @indecisivewear",
    likes: 234,
    comments: 12,
    productName: "Urban Oversized Tee",
    hashtags: ["#IndecisiveWear", "#BTS", "#Photoshoot"],
    verified: false,
    featured: false,
  },
  {
    id: 6,
    type: "photo",
    image: "/placeholder.svg?height=400&width=400&text=Night+Look",
    customerName: "Casey Park",
    username: "@caseynight",
    platform: "twitter",
    caption: "Night out vibes with the Night Rider Hoodie 🌙",
    likes: 445,
    comments: 18,
    productName: "Night Rider Hoodie",
    hashtags: ["#IndecisiveWear", "#NightOut", "#StreetStyle"],
    verified: false,
    featured: false,
  },
]

export function EnhancedCommunitySection() {
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [activeTab, setActiveTab] = useState<"featured" | "recent" | "trending">("featured")

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4 text-pink-500" />
      case "twitter":
        return <Twitter className="h-4 w-4 text-blue-500" />
      case "tiktok":
        return <div className="h-4 w-4 bg-black rounded-full" />
      default:
        return <Camera className="h-4 w-4" />
    }
  }

  const filteredPosts = communityPosts.filter((post) => {
    if (activeTab === "featured") return post.featured
    if (activeTab === "trending") return post.likes > 1000
    return true
  })

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Camera className="h-4 w-4" />
            COMMUNITY SPOTLIGHT
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            STYLE
            <span className="block text-black/60">COMMUNITY</span>
          </h2>
          <p className="text-black/60 text-lg max-w-2xl mx-auto mb-8">
            Real customers, real style. See how our community brings Indecisive Wear to life.
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white border border-black/10 p-1 inline-flex">
              {[
                { key: "featured", label: "FEATURED" },
                { key: "trending", label: "TRENDING" },
                { key: "recent", label: "RECENT" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 text-sm font-mono font-bold transition-all ${
                    activeTab === tab.key ? "bg-black text-white" : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-mono border-0 bg-pink-50"
              onClick={() => window.open("https://instagram.com/indecisivewear", "_blank")}
            >
              <Instagram className="h-4 w-4 mr-2" />
              @indecisivewear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-mono border-0 bg-blue-50"
              onClick={() => window.open("https://twitter.com/indecisivewear", "_blank")}
            >
              <Twitter className="h-4 w-4 mr-2" />
              #IndecisiveStyle
            </Button>
          </div>
        </div>

        {/* Posts Grid - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className={`group cursor-pointer flex-shrink-0 ${
                index === 0 ? "w-[320px] sm:w-[400px]" : "w-[280px] sm:w-[320px]"
              }`}
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative overflow-hidden bg-white border border-black/5 hover:border-black/20 transition-all duration-300 hover:shadow-lg">
                {/* Image/Video */}
                <div className={`relative ${index === 0 ? "aspect-[4/5]" : "aspect-square"}`}>
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={`Post by ${post.customerName}`}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                  />

                  {/* Video Play Button */}
                  {post.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/80 text-white rounded-full p-4 group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Platform Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1">
                      {getPlatformIcon(post.platform)}
                      <span className="text-xs font-mono font-bold">{post.platform.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {post.featured && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-500 text-black text-xs font-mono border-0">FEATURED</Badge>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {post.customerName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{post.username}</span>
                        {post.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-black/60">{post.customerName}</p>
                    </div>
                  </div>

                  {/* Caption */}
                  <p className="text-sm line-clamp-2 leading-relaxed">{post.caption}</p>

                  {/* Product Tag */}
                  <div className="inline-flex items-center gap-1 bg-black/5 px-2 py-1 text-xs font-mono">
                    <div className="w-2 h-2 bg-black rounded-full" />
                    {post.productName}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/5">
                    <div className="flex items-center gap-4 text-xs text-black/60">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs hover:bg-black/5">
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="bg-black text-white p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">JOIN THE COMMUNITY</h3>
            <p className="text-white/80 mb-6">
              Share your style and get featured! Tag us @indecisivewear or use #IndecisiveStyle
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-black hover:bg-gray-100 font-mono border-0">
                <Camera className="h-4 w-4 mr-2" />
                UPLOAD YOUR STYLE
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black font-mono">
                VIEW ALL POSTS
              </Button>
            </div>
          </div>
        </div>

        {/* Post Modal */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="max-w-full w-full h-full max-h-screen m-0 p-0 font-mono md:max-w-4xl md:h-auto md:max-h-[90vh] md:m-4 md:p-6">
              <div className="flex flex-col h-full md:grid md:grid-cols-2 md:gap-6 md:h-auto">
                {/* Image */}
                <div className="relative flex-shrink-0 h-[50vh] md:h-auto">
                  <Image
                    src={selectedPost.image || "/placeholder.svg"}
                    alt={`Post by ${selectedPost.customerName}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white h-11 w-11"
                    onClick={() => setSelectedPost(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-4 md:p-0 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedPost.customerName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{selectedPost.username}</span>
                        {selectedPost.verified && <Star className="h-4 w-4 text-blue-500 fill-blue-500" />}
                        {getPlatformIcon(selectedPost.platform)}
                      </div>
                      <p className="text-sm text-black/60">{selectedPost.customerName}</p>
                    </div>
                  </div>

                  <p className="text-base leading-relaxed">{selectedPost.caption}</p>

                  <div className="flex flex-wrap gap-2">
                    {selectedPost.hashtags.map((hashtag) => (
                      <Badge key={hashtag} variant="outline" className="text-xs font-mono border-0 bg-black/5">
                        {hashtag}
                      </Badge>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4">
                    <h4 className="font-bold mb-2 uppercase tracking-wider">Featured Product</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{selectedPost.productName}</span>
                      <Button className="bg-black text-white hover:bg-black/80 font-mono border-0">SHOP NOW</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-black/10">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 font-mono">
                        <Heart className="h-4 w-4" />
                        {selectedPost.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-2 font-mono">
                        <MessageCircle className="h-4 w-4" />
                        {selectedPost.comments}
                      </span>
                    </div>
                    <Button variant="outline" className="border-0 bg-black/5 hover:bg-black/10 font-mono">
                      <Share2 className="h-4 w-4 mr-2" />
                      SHARE
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  )
}
