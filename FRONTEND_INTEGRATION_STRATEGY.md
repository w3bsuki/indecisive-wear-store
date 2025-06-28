# Frontend Integration Strategy: Next.js + Medusa + Stripe + Supabase

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Vercel)                 │
├─────────────────┬────────────────┬──────────────────────────┤
│   Medusa SDK    │  Stripe SDK   │    Supabase Client       │
└────────┬────────┴───────┬────────┴───────────┬──────────────┘
         │                │                     │
         ▼                ▼                     ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────────┐
│  Medusa Backend │ │    Stripe    │ │     Supabase       │
│  (Railway/Render)│ │   Payments   │ │  Auth + Storage    │
└─────────────────┘ └──────────────┘ └────────────────────┘
```

## 1. Service Integration Layer

### 1.1 Create Unified API Client
```typescript
// lib/api/index.ts
import { MedusaClient } from './medusa-client'
import { StripeClient } from './stripe-client'
import { SupabaseClient } from './supabase-client'

export class UnifiedAPIClient {
  private medusa: MedusaClient
  private stripe: StripeClient
  private supabase: SupabaseClient

  constructor() {
    this.medusa = new MedusaClient()
    this.stripe = new StripeClient()
    this.supabase = new SupabaseClient()
  }

  // Unified authentication
  async authenticate(email: string, password: string) {
    // 1. Authenticate with Medusa
    const medusaAuth = await this.medusa.auth.authenticate({ email, password })
    
    // 2. Sync with Supabase
    const supabaseAuth = await this.supabase.auth.signIn({ email, password })
    
    // 3. Store unified session
    return this.createUnifiedSession(medusaAuth, supabaseAuth)
  }

  // Product with reviews
  async getProductWithSocial(productId: string) {
    const [product, reviews, interactions] = await Promise.all([
      this.medusa.products.retrieve(productId),
      this.supabase.getProductReviews(productId),
      this.supabase.getProductInteractions(productId)
    ])

    return {
      ...product,
      reviews,
      interactions
    }
  }

  // Checkout with Stripe
  async createCheckoutSession(cart: Cart) {
    // 1. Create Medusa draft order
    const order = await this.medusa.carts.complete(cart.id)
    
    // 2. Create Stripe payment intent
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: order.total,
      metadata: { order_id: order.id }
    })
    
    // 3. Track in Supabase analytics
    await this.supabase.trackEvent('checkout_started', {
      order_id: order.id,
      amount: order.total
    })
    
    return { order, paymentIntent }
  }
}
```

### 1.2 Context Providers Setup
```typescript
// app/providers.tsx
'use client'

import { MedusaProvider } from '@/providers/medusa-provider'
import { StripeProvider } from '@/providers/stripe-provider'
import { SupabaseProvider } from '@/providers/supabase-provider'
import { UnifiedAuthProvider } from '@/providers/unified-auth-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MedusaProvider>
      <SupabaseProvider>
        <StripeProvider>
          <UnifiedAuthProvider>
            {children}
          </UnifiedAuthProvider>
        </StripeProvider>
      </SupabaseProvider>
    </MedusaProvider>
  )
}
```

## 2. Authentication Strategy

### 2.1 Unified Auth Hook
```typescript
// hooks/use-unified-auth.ts
import { useEffect, useState } from 'react'
import { useMedusaAuth } from './use-medusa-auth'
import { useSupabaseAuth } from './use-supabase-auth'

export function useUnifiedAuth() {
  const medusa = useMedusaAuth()
  const supabase = useSupabaseAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Sync auth states
    const syncAuth = async () => {
      if (medusa.customer && !supabase.user) {
        // Medusa authenticated but not Supabase
        await supabase.signInWithCustomToken(medusa.customer.id)
      } else if (!medusa.customer && supabase.user) {
        // Supabase authenticated but not Medusa
        await medusa.authenticateWithSupabase(supabase.user.id)
      }
      
      setIsAuthenticated(!!(medusa.customer && supabase.user))
    }

    syncAuth()
  }, [medusa.customer, supabase.user])

  return {
    isAuthenticated,
    user: medusa.customer,
    signIn: async (email: string, password: string) => {
      await Promise.all([
        medusa.signIn(email, password),
        supabase.signIn(email, password)
      ])
    },
    signOut: async () => {
      await Promise.all([
        medusa.signOut(),
        supabase.signOut()
      ])
    }
  }
}
```

### 2.2 Protected Routes
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/account')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*']
}
```

## 3. Data Fetching Strategy

### 3.1 Server Components with Caching
```typescript
// app/products/[id]/page.tsx
import { cache } from 'react'
import { medusaClient } from '@/lib/medusa-client'
import { supabase } from '@/lib/supabase-server'

const getProduct = cache(async (id: string) => {
  const product = await medusaClient.products.retrieve(id)
  return product
})

const getProductReviews = cache(async (productId: string) => {
  const { data } = await supabase
    .from('reviews')
    .select('*, customer_profiles(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  
  return data
})

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, reviews] = await Promise.all([
    getProduct(params.id),
    getProductReviews(params.id)
  ])

  return (
    <div>
      <ProductDetails product={product} />
      <ProductReviews reviews={reviews} />
    </div>
  )
}
```

### 3.2 Real-time Updates
```typescript
// components/live-inventory.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export function LiveInventory({ variantId }: { variantId: string }) {
  const [inventory, setInventory] = useState<number | null>(null)

  useEffect(() => {
    // Initial fetch from Medusa
    fetch(`/api/inventory/${variantId}`)
      .then(res => res.json())
      .then(data => setInventory(data.quantity))

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`inventory:${variantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory_items',
          filter: `variant_id=eq.${variantId}`
        },
        (payload) => {
          setInventory(payload.new.quantity)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [variantId])

  if (inventory === null) return <div>Loading...</div>
  if (inventory === 0) return <div className="text-red-500">Out of Stock</div>
  if (inventory < 5) return <div className="text-orange-500">Only {inventory} left!</div>
  
  return <div className="text-green-500">In Stock</div>
}
```

## 4. Payment Integration

### 4.1 Checkout Flow
```typescript
// app/checkout/page.tsx
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from '@/components/checkout-form'
import { useCart } from '@/hooks/use-cart'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const { cart } = useCart()

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        clientSecret: cart?.payment_intent_client_secret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
          }
        }
      }}
    >
      <CheckoutForm cart={cart} />
    </Elements>
  )
}
```

### 4.2 Payment Processing
```typescript
// components/checkout-form.tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CheckoutForm({ cart }: { cart: Cart }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsProcessing(true)

    try {
      // 1. Complete cart in Medusa
      const order = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: cart.id })
      }).then(res => res.json())

      // 2. Confirm payment with Stripe
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirmed`,
        },
        redirect: 'if_required'
      })

      if (!error) {
        // 3. Track conversion in Supabase
        await fetch('/api/analytics/conversion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            amount: order.total,
            customer_id: order.customer_id
          })
        })

        router.push(`/order/confirmed?order_id=${order.id}`)
      }
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-black text-white py-3 mt-4"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}
```

## 5. File Upload Strategy

### 5.1 Product Image Upload
```typescript
// components/admin/product-image-upload.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { medusaAdmin } from '@/lib/medusa-admin'

export function ProductImageUpload({ productId }: { productId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // 1. Upload to Supabase Storage
      const fileName = `products/${productId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: false
        })

      if (error) throw error

      // 2. Get public URL with transformation
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName, {
          transform: {
            width: 1000,
            height: 1000,
            resize: 'contain',
            format: 'webp'
          }
        })

      // 3. Update product in Medusa
      await medusaAdmin.products.update(productId, {
        images: [{ url: publicUrl }]
      })

      // 4. Generate thumbnails
      await generateThumbnails(fileName, productId)

    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <input 
      type="file" 
      onChange={handleUpload} 
      disabled={uploading}
      accept="image/*"
    />
  )
}
```

## 6. API Routes Integration

### 6.1 Unified API Handler
```typescript
// app/api/unified/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { medusaClient } from '@/lib/medusa-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')

  try {
    // Route to appropriate service
    if (path.startsWith('products')) {
      // Get product from Medusa
      const productId = path.split('/')[1]
      const product = await medusaClient.products.retrieve(productId)
      
      // Enhance with Supabase data
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
      
      return NextResponse.json({
        ...product,
        reviews,
        review_count: reviews?.length || 0,
        average_rating: calculateAverageRating(reviews)
      })
    }

    // Add more route handlers...

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### 6.2 Webhook Handlers
```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe-server'
import { medusaAdmin } from '@/lib/medusa-admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        
        // Update Medusa order
        await medusaAdmin.orders.update(
          paymentIntent.metadata.order_id,
          { payment_status: 'captured' }
        )
        
        // Track in Supabase
        await supabaseAdmin.from('payment_events').insert({
          order_id: paymentIntent.metadata.order_id,
          event_type: 'payment_captured',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        })
        
        break
      
      // Handle other events...
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response('Webhook Error', { status: 400 })
  }
}
```

## 7. Performance Optimization

### 7.1 Data Preloading
```typescript
// app/layout.tsx
import { headers } from 'next/headers'
import { preloadQuery } from '@/lib/preload'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Preload common data
  preloadQuery('regions', () => medusaClient.regions.list())
  preloadQuery('product-categories', () => medusaClient.productCategories.list())
  
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 7.2 Image Optimization
```typescript
// next.config.js
module.exports = {
  images: {
    domains: [
      'your-project.supabase.co',
      'medusa-public-images.s3.eu-west-1.amazonaws.com'
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
  }
}
```

## 8. Error Handling

### 8.1 Global Error Boundary
```typescript
// app/error.tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error)
    
    // Log to Supabase
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest
      })
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## 9. Deployment Configuration

### 9.1 Environment Variables (Vercel)
```bash
# Production
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Server-side only
MEDUSA_API_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### 9.2 Build Configuration
```json
// vercel.json
{
  "functions": {
    "app/api/checkout/complete/route.ts": {
      "maxDuration": 30
    },
    "app/api/webhooks/*/route.ts": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/store/:path*",
      "destination": "https://api.yourdomain.com/store/:path*"
    }
  ]
}
```

This integration strategy ensures seamless communication between all services while maintaining performance, security, and scalability.