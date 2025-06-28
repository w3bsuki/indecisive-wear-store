"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Instagram, Twitter, Facebook, Heart, MessageCircle, Share2, X } from "lucide-react"

interface SocialPost {
  id: number
  platform: "instagram" | "twitter" | "facebook"
  username: string
  image: string
  caption: string
  likes: number
  comments: number
  timestamp: string
  productName: string
  hashtags: string[]
  isVerified?: boolean
}

const socialPosts: SocialPost[] = [
  {
    id: 1,
    platform: "instagram",
    username: "sarah_styles",
    image: "/placeholder.svg?height=300&width=240&text=Instagram+1",
    caption: "Obsessed with my new @indecisivewear Essential White Tee! ⭐⭐⭐⭐⭐",
    likes: 234,
    comments: 18,
    timestamp: "2h",
    productName: "Essential White Tee",
    hashtags: ["#IndecisiveWear", "#OOTD"],
    isVerified: true,
  },
  {
    id: 2,
    platform: "twitter",
    username: "alex_urban",
    image: "/placeholder.svg?height=300&width=240&text=Twitter+1",
    caption: "Finally found the perfect bomber jacket! @indecisivewear never disappoints 🔥",
    likes: 89,
    comments: 12,
    timestamp: "4h",
    productName: "Shadow Bomber",
    hashtags: ["#IndecisiveWear", "#StreetStyle"],
  },
  {
    id: 3,
    platform: "instagram",
    username: "jordan_minimal",
    image: "/placeholder.svg?height=300&width=240&text=Instagram+2",
    caption: "Clean lines, pure comfort. This hoodie is everything! 🖤🤍",
    likes: 156,
    comments: 23,
    timestamp: "6h",
    productName: "Clean Lines Hoodie",
    hashtags: ["#IndecisiveWear", "#MinimalistFashion"],
  },
  {
    id: 4,
    platform: "facebook",
    username: "casey_fashion",
    image: "/placeholder.svg?height=300&width=240&text=Facebook+1",
    caption: "Love how versatile these pieces are! Highly recommend @IndecisiveWear!",
    likes: 67,
    comments: 8,
    timestamp: "8h",
    productName: "Street Cargo Pants",
    hashtags: ["#IndecisiveWear", "#Versatile"],
  },
  {
    id: 5,
    platform: "instagram",
    username: "taylor_fit",
    image: "/placeholder.svg?height=300&width=240&text=Instagram+3",
    caption: "These cargo pants are a game changer! Perfect fit 👌",
    likes: 445,
    comments: 31,
    timestamp: "12h",
    productName: "Street Cargo Pants",
    hashtags: ["#IndecisiveWear", "#CargoStyle"],
    isVerified: true,
  },
  {
    id: 6,
    platform: "twitter",
    username: "morgan_style",
    image: "/placeholder.svg?height=300&width=240&text=Twitter+2",
    caption: "Night out vibes with the Night Rider Hoodie 🌙",
    likes: 178,
    comments: 15,
    timestamp: "1d",
    productName: "Night Rider Hoodie",
    hashtags: ["#IndecisiveWear", "#NightOut"],
  },
  {
    id: 7,
    platform: "instagram",
    username: "avery_minimal",
    image: "/placeholder.svg?height=300&width=240&text=Instagram+4",
    caption: "Minimalist perfection ✨ Love this oversized tee",
    likes: 289,
    comments: 19,
    timestamp: "1d",
    productName: "Urban Oversized Tee",
    hashtags: ["#IndecisiveWear", "#Minimal"],
  },
  {
    id: 8,
    platform: "instagram",
    username: "riley_street",
    image: "/placeholder.svg?height=300&width=240&text=Instagram+5",
    caption: "Exactly what I wanted! Quality is amazing 🔥",
    likes: 334,
    comments: 27,
    timestamp: "2d",
    productName: "Essential Black Tee",
    hashtags: ["#IndecisiveWear", "#Quality"],
  },
]

interface SocialMediaFeedProps {
  title?: string
  showHeader?: boolean
  maxPosts?: number
}

export function SocialMediaFeed({ title = "Style Community", showHeader = true, maxPosts = 8 }: SocialMediaFeedProps) {
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-3 w-3 text-pink-500" />
      case "twitter":
        return <Twitter className="h-3 w-3 text-blue-500" />
      case "facebook":
        return <Facebook className="h-3 w-3 text-blue-600" />
      default:
        return <Share2 className="h-3 w-3" />
    }
  }

  // Show all posts up to maxPosts
  const postsToShow = socialPosts.slice(0, maxPosts)

  // Social card component - exactly like ProductCard
  const SocialCard = ({ post }: { post: SocialPost }) => (
    <div className="group min-w-[160px] sm:min-w-[200px] md:min-w-[280px] flex-shrink-0">
      <div className="relative overflow-hidden mb-2">
        <div className="aspect-[3/4] relative">
          <img
            src={post.image || "/placeholder.svg"}
            alt={`Post by ${post.username}`}
            className="w-full h-full object-cover"
          />

          {/* Platform Badge */}
          <div className="absolute top-2 left-2">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1">
              {getPlatformIcon(post.platform)}
              <span className="text-[10px] font-mono font-bold">{post.platform.toUpperCase()}</span>
            </div>
          </div>

          {/* Verified Badge */}
          {post.isVerified && (
            <Badge className="absolute top-2 right-2 bg-blue-500 text-white font-mono text-[10px] px-2 py-1 border-0">
              ✓
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1 px-1">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-mono font-bold text-xs truncate">@{post.username}</span>
        </div>

        {/* Caption */}
        <p className="text-xs sm:text-sm font-mono line-clamp-2 leading-relaxed">{post.caption}</p>

        {/* Product Tag */}
        <div className="inline-flex items-center gap-1 bg-black/5 px-2 py-1 text-[10px] font-mono">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
          {post.productName}
        </div>

        {/* Engagement */}
        <div className="flex items-center gap-3 text-[10px] text-black/60">
          <span className="flex items-center gap-1">
            <Heart className="h-2.5 w-2.5" />
            {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-2.5 w-2.5" />
            {post.comments}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {showHeader && (
        <div className="flex items-end justify-between mb-4 md:mb-8">
          <div>
            <h2 className="text-xl md:text-5xl font-bold tracking-tight mb-1">{title}</h2>
            <p className="text-black/60 text-xs md:text-xl font-mono">See how our customers style their pieces</p>
          </div>
          <Button
            variant="outline"
            className="bg-black/5 hover:bg-black hover:text-white font-mono text-xs md:text-base px-3 md:px-6"
          >
            VIEW ALL
          </Button>
        </div>
      )}

      {/* Horizontal Scroll Container - EXACTLY like product sections */}
      <div className="flex gap-3 md:gap-8 overflow-x-auto pb-4 scrollbar-hide">
        {postsToShow.map((post) => (
          <div key={post.id} onClick={() => setSelectedPost(post)} className="cursor-pointer">
            <SocialCard post={post} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-full w-full h-full max-h-screen m-0 p-0 font-mono md:max-w-4xl md:h-auto md:max-h-[90vh] md:m-4 md:p-6">
            <div className="flex flex-col h-full md:grid md:grid-cols-2 md:gap-6 md:h-auto">
              <div className="relative flex-shrink-0 h-[50vh] md:h-auto">
                <img
                  src={selectedPost.image || "/placeholder.svg"}
                  alt={`Post by ${selectedPost.username}`}
                  className="w-full h-full object-cover"
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

              <div className="flex-1 flex flex-col p-4 md:p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedPost.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">@{selectedPost.username}</span>
                      {selectedPost.isVerified && <Badge className="bg-blue-500 text-white text-xs">✓</Badge>}
                      {getPlatformIcon(selectedPost.platform)}
                    </div>
                    <p className="text-sm text-black/60">{selectedPost.timestamp}</p>
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
    </>
  )
}
