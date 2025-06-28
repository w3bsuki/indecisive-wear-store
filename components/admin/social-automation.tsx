"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Instagram,
  Twitter,
  Facebook,
  Settings,
  Clock,
  Star,
  Eye,
  Send,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"

interface AutoPostRule {
  id: number
  name: string
  enabled: boolean
  platforms: ("instagram" | "twitter" | "facebook")[]
  triggers: {
    minRating: number
    hasPhotos: boolean
    verifiedOnly: boolean
    productCategories: string[]
  }
  template: {
    instagram: string
    twitter: string
    facebook: string
  }
  schedule: {
    frequency: "immediate" | "daily" | "weekly"
    time: string
    maxPerDay: number
  }
  lastRun: string
  postsCreated: number
}

interface QueuedPost {
  id: number
  reviewId: number
  platform: "instagram" | "twitter" | "facebook"
  content: string
  image?: string
  scheduledFor: string
  status: "pending" | "posted" | "failed" | "cancelled"
  customerName: string
  productName: string
  rating: number
  createdAt: string
}

interface SocialAccount {
  platform: "instagram" | "twitter" | "facebook"
  username: string
  connected: boolean
  lastSync: string
  followers: number
  postsThisMonth: number
}

// Mock data
const mockRules: AutoPostRule[] = [
  {
    id: 1,
    name: "5-Star Reviews with Photos",
    enabled: true,
    platforms: ["instagram", "twitter"],
    triggers: {
      minRating: 5,
      hasPhotos: true,
      verifiedOnly: true,
      productCategories: ["Essentials", "Streetwear"],
    },
    template: {
      instagram:
        "🌟 Amazing review from @{customerName}! \n\n'{reviewTitle}' \n\n📸 Love seeing how you style our {productName}! \n\n#IndecisiveWear #CustomerLove #OOTD",
      twitter:
        "⭐ '{reviewTitle}' - @{customerName} on our {productName}! Thanks for sharing your style! 📸 #IndecisiveWear",
      facebook:
        "We love seeing happy customers! {customerName} shared this amazing review of our {productName}: '{reviewTitle}' ⭐⭐⭐⭐⭐",
    },
    schedule: {
      frequency: "daily",
      time: "10:00",
      maxPerDay: 3,
    },
    lastRun: "2024-01-15T10:00:00Z",
    postsCreated: 24,
  },
  {
    id: 2,
    name: "High-Rating Text Reviews",
    enabled: false,
    platforms: ["twitter", "facebook"],
    triggers: {
      minRating: 4,
      hasPhotos: false,
      verifiedOnly: false,
      productCategories: [],
    },
    template: {
      instagram: "",
      twitter:
        "💭 '{reviewTitle}' - Thanks {customerName} for the {rating}⭐ review! #IndecisiveWear #CustomerFeedback",
      facebook:
        "Customer spotlight! {customerName} gave our {productName} {rating} stars: '{reviewTitle}' Thank you for choosing Indecisive Wear!",
    },
    schedule: {
      frequency: "weekly",
      time: "14:00",
      maxPerDay: 2,
    },
    lastRun: "2024-01-10T14:00:00Z",
    postsCreated: 8,
  },
]

const mockQueue: QueuedPost[] = [
  {
    id: 1,
    reviewId: 123,
    platform: "instagram",
    content:
      "🌟 Amazing review from @sarah_styles! \n\n'Perfect Essential Tee' \n\n📸 Love seeing how you style our Essential White Tee! \n\n#IndecisiveWear #CustomerLove #OOTD",
    image: "/placeholder.svg?height=400&width=400&text=Review+Photo",
    scheduledFor: "2024-01-16T10:00:00Z",
    status: "pending",
    customerName: "Sarah M.",
    productName: "Essential White Tee",
    rating: 5,
    createdAt: "2024-01-15T15:30:00Z",
  },
  {
    id: 2,
    reviewId: 124,
    platform: "twitter",
    content:
      "⭐ 'Minimalist perfection' - @jordan_minimal on our Essential White Tee! Thanks for sharing your style! 📸",
    scheduledFor: "2024-01-16T10:30:00Z",
    status: "pending",
    customerName: "Jordan P.",
    productName: "Essential White Tee",
    rating: 5,
    createdAt: "2024-01-15T16:00:00Z",
  },
  {
    id: 3,
    reviewId: 125,
    platform: "facebook",
    content:
      "We love seeing happy customers! Alex K. shared this amazing review of our Essential White Tee: 'Great quality, slightly oversized' ⭐⭐⭐⭐",
    scheduledFor: "2024-01-15T18:00:00Z",
    status: "posted",
    customerName: "Alex K.",
    productName: "Essential White Tee",
    rating: 4,
    createdAt: "2024-01-15T12:00:00Z",
  },
]

const mockAccounts: SocialAccount[] = [
  {
    platform: "instagram",
    username: "@indecisivewear",
    connected: true,
    lastSync: "2024-01-15T16:00:00Z",
    followers: 12500,
    postsThisMonth: 18,
  },
  {
    platform: "twitter",
    username: "@indecisivewear",
    connected: true,
    lastSync: "2024-01-15T16:00:00Z",
    followers: 8200,
    postsThisMonth: 25,
  },
  {
    platform: "facebook",
    username: "IndecisiveWear",
    connected: false,
    lastSync: "",
    followers: 0,
    postsThisMonth: 0,
  },
]

export function SocialAutomation() {
  const [rules, setRules] = useState<AutoPostRule[]>(mockRules)
  const [queue, setQueue] = useState<QueuedPost[]>(mockQueue)
  const [accounts, setAccounts] = useState<SocialAccount[]>(mockAccounts)
  const [selectedRule, setSelectedRule] = useState<AutoPostRule | null>(null)

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4 text-pink-500" />
      case "twitter":
        return <Twitter className="h-4 w-4 text-blue-500" />
      case "facebook":
        return <Facebook className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "posted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const toggleRule = (ruleId: number) => {
    setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const cancelPost = (postId: number) => {
    setQueue((prev) => prev.map((post) => (post.id === postId ? { ...post, status: "cancelled" as const } : post)))
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">Social Media Automation</h1>
          <p className="text-black/60 text-sm">Automatically share customer reviews to social platforms</p>
        </div>
        <Button className="bg-black text-white hover:bg-black/80 font-mono">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 font-mono">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="queue">Post Queue</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Posts This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">43</div>
                <p className="text-xs text-black/60">+12 from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Queued Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queue.filter((p) => p.status === "pending").length}</div>
                <p className="text-xs text-black/60">Next in 2 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2%</div>
                <p className="text-xs text-black/60">Above average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28.4K</div>
                <p className="text-xs text-black/60">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono uppercase tracking-wider">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queue.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border border-black/10">
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(post.platform)}
                      <div>
                        <p className="font-mono font-bold text-sm">{post.productName}</p>
                        <p className="text-xs text-black/60">by {post.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(post.status)}
                      <Badge variant="outline" className="font-mono text-xs">
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-mono uppercase tracking-wider">Automation Rules</h2>
            <CreateRuleDialog>
              <Button className="bg-black text-white hover:bg-black/80 font-mono">Create Rule</Button>
            </CreateRuleDialog>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                      <div>
                        <CardTitle className="font-mono">{rule.name}</CardTitle>
                        <p className="text-sm text-black/60">
                          {rule.postsCreated} posts created • Last run: {new Date(rule.lastRun).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EditRuleDialog rule={rule}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditRuleDialog>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">Platforms:</span>
                      {rule.platforms.map((platform) => (
                        <div key={platform} className="flex items-center gap-1">
                          {getPlatformIcon(platform)}
                          <span className="text-xs font-mono">{platform}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="font-mono font-bold">Min Rating:</span>
                        <div className="flex items-center gap-1">
                          {[...Array(rule.triggers.minRating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-mono font-bold">Photos:</span>
                        <p>{rule.triggers.hasPhotos ? "Required" : "Optional"}</p>
                      </div>
                      <div>
                        <span className="font-mono font-bold">Verified:</span>
                        <p>{rule.triggers.verifiedOnly ? "Only" : "All"}</p>
                      </div>
                      <div>
                        <span className="font-mono font-bold">Frequency:</span>
                        <p>{rule.schedule.frequency}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-mono uppercase tracking-wider">Post Queue</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32 font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="font-mono">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {queue.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      {post.image && (
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt="Post image"
                          className="w-16 h-16 object-cover border"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(post.platform)}
                          <span className="font-mono font-bold text-sm">{post.platform}</span>
                          {getStatusIcon(post.status)}
                          <Badge variant="outline" className="font-mono text-xs">
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-black/60">
                          <span>Product: {post.productName}</span>
                          <span>Customer: {post.customerName}</span>
                          <span>Rating: {post.rating}⭐</span>
                          <span>Scheduled: {new Date(post.scheduledFor).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => cancelPost(post.id)}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-mono uppercase tracking-wider">Connected Accounts</h2>
            <Button className="bg-black text-white hover:bg-black/80 font-mono">Connect Account</Button>
          </div>

          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.platform}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getPlatformIcon(account.platform)}
                      <div>
                        <h3 className="font-mono font-bold capitalize">{account.platform}</h3>
                        <p className="text-sm text-black/60">
                          {account.connected ? account.username : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {account.connected && (
                        <div className="text-right text-sm">
                          <p className="font-mono font-bold">{account.followers.toLocaleString()} followers</p>
                          <p className="text-black/60">{account.postsThisMonth} posts this month</p>
                        </div>
                      )}
                      <Badge variant={account.connected ? "default" : "secondary"} className="font-mono">
                        {account.connected ? "Connected" : "Disconnected"}
                      </Badge>
                      <Button variant={account.connected ? "outline" : "default"} className="font-mono" size="sm">
                        {account.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                  {account.connected && (
                    <div className="mt-4 pt-4 border-t border-black/10">
                      <p className="text-xs text-black/60">Last sync: {new Date(account.lastSync).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CreateRuleDialog({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("")
  const [platforms, setPlatforms] = useState<string[]>([])
  const [minRating, setMinRating] = useState(5)
  const [hasPhotos, setHasPhotos] = useState(true)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl font-mono">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-wider">Create Automation Rule</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Rule Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 5-Star Reviews with Photos"
              className="font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Platforms</label>
            <div className="flex gap-4">
              {["instagram", "twitter", "facebook"].map((platform) => (
                <label key={platform} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPlatforms([...platforms, platform])
                      } else {
                        setPlatforms(platforms.filter((p) => p !== platform))
                      }
                    }}
                  />
                  <span className="font-mono capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Minimum Rating</label>
              <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number.parseInt(value))}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} Star{rating > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={hasPhotos} onChange={(e) => setHasPhotos(e.target.checked)} />
                <span className="font-mono text-sm">Require Photos</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
                <span className="font-mono text-sm">Verified Customers Only</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Instagram Template</label>
            <Textarea
              placeholder="🌟 Amazing review from @{customerName}! ..."
              className="font-mono text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button className="flex-1 bg-black text-white hover:bg-black/80 font-mono">Create Rule</Button>
            <Button
              variant="outline"
              className="flex-1 border-2 border-black hover:bg-black hover:text-white font-mono"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditRuleDialog({ rule, children }: { rule: AutoPostRule; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl font-mono">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-wider">Edit Rule: {rule.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Instagram Template</label>
            <Textarea defaultValue={rule.template.instagram} className="font-mono text-sm" rows={4} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Twitter Template</label>
            <Textarea defaultValue={rule.template.twitter} className="font-mono text-sm" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Facebook Template</label>
            <Textarea defaultValue={rule.template.facebook} className="font-mono text-sm" rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Frequency</label>
              <Select defaultValue={rule.schedule.frequency}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Time</label>
              <Input defaultValue={rule.schedule.time} type="time" className="font-mono" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Max Per Day</label>
              <Input defaultValue={rule.schedule.maxPerDay} type="number" min="1" max="10" className="font-mono" />
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1 bg-black text-white hover:bg-black/80 font-mono">Save Changes</Button>
            <Button
              variant="outline"
              className="flex-1 border-2 border-black hover:bg-black hover:text-white font-mono"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
