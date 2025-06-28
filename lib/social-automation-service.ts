"use client"

interface Review {
  id: number
  customerName: string
  rating: number
  title: string
  content: string
  productName: string
  productCategory: string
  size: string
  images?: string[]
  verified: boolean
  date: string
}

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
}

interface SocialPost {
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

class SocialAutomationService {
  private rules: AutoPostRule[] = []
  private queue: SocialPost[] = []
  private dailyPostCounts: Record<string, number> = {}

  constructor() {
    this.loadRules()
    this.loadQueue()
    this.startScheduler()
  }

  // Load automation rules from storage
  private loadRules() {
    const stored = localStorage.getItem("social-automation-rules")
    if (stored) {
      this.rules = JSON.parse(stored)
    }
  }

  // Load post queue from storage
  private loadQueue() {
    const stored = localStorage.getItem("social-automation-queue")
    if (stored) {
      this.queue = JSON.parse(stored)
    }
  }

  // Save rules to storage
  private saveRules() {
    localStorage.setItem("social-automation-rules", JSON.stringify(this.rules))
  }

  // Save queue to storage
  private saveQueue() {
    localStorage.setItem("social-automation-queue", JSON.stringify(this.queue))
  }

  // Process a new review for automation
  async processReview(review: Review): Promise<void> {
    console.log("Processing review for automation:", review.id)

    for (const rule of this.rules) {
      if (!rule.enabled) continue

      if (this.shouldTriggerRule(rule, review)) {
        await this.createPostsForRule(rule, review)
      }
    }
  }

  // Check if a rule should be triggered for a review
  private shouldTriggerRule(rule: AutoPostRule, review: Review): boolean {
    // Check minimum rating
    if (review.rating < rule.triggers.minRating) {
      return false
    }

    // Check if photos are required
    if (rule.triggers.hasPhotos && (!review.images || review.images.length === 0)) {
      return false
    }

    // Check if verified customers only
    if (rule.triggers.verifiedOnly && !review.verified) {
      return false
    }

    // Check product categories
    if (
      rule.triggers.productCategories.length > 0 &&
      !rule.triggers.productCategories.includes(review.productCategory)
    ) {
      return false
    }

    // Check daily limits
    const today = new Date().toISOString().split("T")[0]
    const todayCount = this.dailyPostCounts[today] || 0
    if (todayCount >= rule.schedule.maxPerDay) {
      return false
    }

    return true
  }

  // Create posts for a triggered rule
  private async createPostsForRule(rule: AutoPostRule, review: Review): Promise<void> {
    for (const platform of rule.platforms) {
      const content = this.generateContent(rule.template[platform], review)
      const scheduledFor = this.calculateScheduleTime(rule)

      const post: SocialPost = {
        id: Date.now() + Math.random(),
        reviewId: review.id,
        platform,
        content,
        image: review.images?.[0],
        scheduledFor,
        status: "pending",
        customerName: review.customerName,
        productName: review.productName,
        rating: review.rating,
        createdAt: new Date().toISOString(),
      }

      this.queue.push(post)
      console.log(`Created ${platform} post for review ${review.id}`)
    }

    // Update daily count
    const today = new Date().toISOString().split("T")[0]
    this.dailyPostCounts[today] = (this.dailyPostCounts[today] || 0) + rule.platforms.length

    this.saveQueue()
  }

  // Generate content from template
  private generateContent(template: string, review: Review): string {
    return template
      .replace(/\{customerName\}/g, review.customerName)
      .replace(/\{reviewTitle\}/g, review.title)
      .replace(/\{productName\}/g, review.productName)
      .replace(/\{rating\}/g, review.rating.toString())
      .replace(/\{size\}/g, review.size)
  }

  // Calculate when to schedule the post
  private calculateScheduleTime(rule: AutoPostRule): string {
    const now = new Date()

    switch (rule.schedule.frequency) {
      case "immediate":
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString() // 5 minutes from now

      case "daily":
        const [hours, minutes] = rule.schedule.time.split(":").map(Number)
        const scheduledDate = new Date()
        scheduledDate.setHours(hours, minutes, 0, 0)

        // If time has passed today, schedule for tomorrow
        if (scheduledDate <= now) {
          scheduledDate.setDate(scheduledDate.getDate() + 1)
        }

        return scheduledDate.toISOString()

      case "weekly":
        const weeklyDate = new Date()
        weeklyDate.setDate(weeklyDate.getDate() + 7)
        const [weeklyHours, weeklyMinutes] = rule.schedule.time.split(":").map(Number)
        weeklyDate.setHours(weeklyHours, weeklyMinutes, 0, 0)
        return weeklyDate.toISOString()

      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1 hour from now
    }
  }

  // Start the scheduler to process queued posts
  private startScheduler() {
    setInterval(() => {
      this.processQueue()
    }, 60 * 1000) // Check every minute
  }

  // Process queued posts that are ready to be published
  private async processQueue() {
    const now = new Date()

    for (const post of this.queue) {
      if (post.status === "pending" && new Date(post.scheduledFor) <= now) {
        await this.publishPost(post)
      }
    }
  }

  // Publish a post to the social platform
  private async publishPost(post: SocialPost): Promise<void> {
    try {
      console.log(`Publishing ${post.platform} post:`, post.content)

      // Simulate API call to social platform
      const success = await this.callSocialAPI(post)

      if (success) {
        post.status = "posted"
        console.log(`Successfully posted to ${post.platform}`)

        // Send notification
        this.sendNotification(`Posted to ${post.platform}: ${post.productName} review`)
      } else {
        post.status = "failed"
        console.error(`Failed to post to ${post.platform}`)
      }
    } catch (error) {
      post.status = "failed"
      console.error(`Error posting to ${post.platform}:`, error)
    }

    this.saveQueue()
  }

  // Simulate social media API calls
  private async callSocialAPI(post: SocialPost): Promise<boolean> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate success/failure (90% success rate)
    return Math.random() > 0.1
  }

  // Send notification about post status
  private sendNotification(message: string) {
    // In a real app, this would send notifications to admins
    console.log("Notification:", message)

    // Show browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Social Automation", {
        body: message,
        icon: "/favicon.ico",
      })
    }
  }

  // Public methods for managing the service

  addRule(rule: AutoPostRule) {
    this.rules.push(rule)
    this.saveRules()
  }

  updateRule(ruleId: number, updates: Partial<AutoPostRule>) {
    const index = this.rules.findIndex((r) => r.id === ruleId)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
      this.saveRules()
    }
  }

  deleteRule(ruleId: number) {
    this.rules = this.rules.filter((r) => r.id !== ruleId)
    this.saveRules()
  }

  getRules(): AutoPostRule[] {
    return this.rules
  }

  getQueue(): SocialPost[] {
    return this.queue
  }

  cancelPost(postId: number) {
    const post = this.queue.find((p) => p.id === postId)
    if (post && post.status === "pending") {
      post.status = "cancelled"
      this.saveQueue()
    }
  }

  reschedulePost(postId: number, newTime: string) {
    const post = this.queue.find((p) => p.id === postId)
    if (post && post.status === "pending") {
      post.scheduledFor = newTime
      this.saveQueue()
    }
  }

  // Analytics methods
  getAnalytics() {
    const totalPosts = this.queue.filter((p) => p.status === "posted").length
    const failedPosts = this.queue.filter((p) => p.status === "failed").length
    const pendingPosts = this.queue.filter((p) => p.status === "pending").length

    const platformStats = this.queue.reduce(
      (acc, post) => {
        if (post.status === "posted") {
          acc[post.platform] = (acc[post.platform] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalPosts,
      failedPosts,
      pendingPosts,
      successRate: totalPosts / (totalPosts + failedPosts) || 0,
      platformStats,
    }
  }
}

// Export singleton instance
export const socialAutomationService = new SocialAutomationService()

// Hook for React components
export function useSocialAutomation() {
  return {
    processReview: (review: Review) => socialAutomationService.processReview(review),
    getRules: () => socialAutomationService.getRules(),
    getQueue: () => socialAutomationService.getQueue(),
    getAnalytics: () => socialAutomationService.getAnalytics(),
    cancelPost: (postId: number) => socialAutomationService.cancelPost(postId),
    reschedulePost: (postId: number, newTime: string) => socialAutomationService.reschedulePost(postId, newTime),
  }
}
