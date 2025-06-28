# Stripe Production Setup for Indecisive Wear Store

This guide provides comprehensive instructions for setting up Stripe payment integration with Medusa 2.0 for production use.

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Integration](#frontend-integration)
4. [Webhook Setup](#webhook-setup)
5. [Security Best Practices](#security-best-practices)
6. [Testing in Production](#testing-in-production)
7. [Deployment Considerations](#deployment-considerations)

## Environment Variables

### Backend Environment Variables (.env)

```bash
# Production Stripe Configuration
STRIPE_API_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SIGNING_SECRET

# Medusa Configuration
MEDUSA_BACKEND_URL=https://your-backend-domain.com
STORE_CORS=https://your-frontend-domain.com
ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-frontend-domain.com,https://your-admin-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Security
JWT_SECRET=your-secure-jwt-secret-min-32-chars
COOKIE_SECRET=your-secure-cookie-secret-min-32-chars

# Redis (for production caching)
REDIS_URL=redis://user:password@redis-host:6379
```

### Frontend Environment Variables (.env.production)

```bash
# Public Stripe Key
NEXT_PUBLIC_STRIPE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend-domain.com
```

## Backend Configuration

### 1. Update medusa-config.ts

```typescript
import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'COOKIE_SECRET',
  'DATABASE_URL',
  'STRIPE_API_KEY',
  'STRIPE_WEBHOOK_SECRET'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`)
  }
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              // Production configuration
              automatic_payment_methods: false,
              payment_method_types: [
                "card",
                "ideal", // European payments
                "sepa_debit", // SEPA Direct Debit
                "bancontact", // Belgium
                "giropay", // Germany
                "eps", // Austria
                "p24", // Poland
                "alipay", // China
                "wechat_pay", // China
                "klarna", // Buy now, pay later
                "afterpay_clearpay", // Buy now, pay later
                "link", // Stripe Link
              ],
              capture: true, // Auto-capture payments
              payment_description: "Indecisive Wear Store Purchase",
              // Fraud prevention
              stripe_options: {
                apiVersion: "2024-11-20.acacia",
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/tax",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/tax-system",
            id: "system",
            options: {
              // Tax configuration for different regions
            },
          },
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: `medusa-file-supabase`,
      options: {
        project_url: process.env.SUPABASE_URL,
        api_key: process.env.SUPABASE_KEY,
        bucket: process.env.SUPABASE_BUCKET,
      },
    },
  ],
})
```

### 2. Create Custom Stripe Webhook Handler

Create `backend/src/api/hooks/payment/stripe/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const sig = req.headers["stripe-signature"] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const paymentModule = req.scope.resolve<IPaymentModuleService>(
    Modules.PAYMENT
  )

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, paymentModule)
        break
      
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, paymentModule)
        break
      
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute, paymentModule)
        break
      
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge, paymentModule)
        break
      
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, paymentModule)
        break
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook: ${error}`)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  paymentModule: IPaymentModuleService
) {
  // Update payment status in Medusa
  console.log(`Payment ${paymentIntent.id} succeeded`)
  // Add your business logic here
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  paymentModule: IPaymentModuleService
) {
  // Handle failed payment
  console.log(`Payment ${paymentIntent.id} failed: ${paymentIntent.last_payment_error?.message}`)
  // Add your business logic here
}

async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  paymentModule: IPaymentModuleService
) {
  // Handle dispute/chargeback
  console.log(`Dispute created: ${dispute.id}`)
  // Add your business logic here
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  paymentModule: IPaymentModuleService
) {
  // Handle refund
  console.log(`Charge ${charge.id} refunded`)
  // Add your business logic here
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  paymentModule: IPaymentModuleService
) {
  // Handle completed checkout session
  console.log(`Checkout session ${session.id} completed`)
  // Add your business logic here
}
```

## Frontend Integration

### 1. Install Stripe Dependencies

```bash
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Create Stripe Provider Component

Create `components/providers/stripe-provider.tsx`:

```tsx
"use client"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { ReactNode } from "react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!)

interface StripeProviderProps {
  children: ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#000000",
            colorBackground: "#ffffff",
            colorText: "#000000",
            colorDanger: "#df1b41",
            fontFamily: '"Sora", system-ui, sans-serif',
            borderRadius: "8px",
          },
        },
        loader: "auto",
      }}
    >
      {children}
    </Elements>
  )
}
```

### 3. Create Payment Form Component

Create `components/checkout/payment-form.tsx`:

```tsx
"use client"

import { useState } from "react"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

interface PaymentFormProps {
  clientSecret: string
  onSuccess: () => void
}

export function PaymentForm({ clientSecret, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: {
            // Add billing details from your form
          },
        },
      },
      redirect: "if_required",
    })

    if (error) {
      setErrorMessage(error.message || "An error occurred during payment")
      setIsProcessing(false)
    } else {
      // Payment succeeded
      onSuccess()
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card", "ideal", "sepa_debit", "klarna"],
          }}
        />
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full mt-6"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Payment"
          )}
        </Button>
      </form>
    </Card>
  )
}
```

### 4. Update Checkout Page

Update `app/checkout/page.tsx`:

```tsx
"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { StripeProvider } from "@/components/providers/stripe-provider"
import { PaymentForm } from "@/components/checkout/payment-form"
import { useRouter } from "next/navigation"
// ... other imports

export default function CheckoutPage() {
  const { cart } = useCart()
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cart.length > 0) {
      createPaymentIntent()
    }
  }, [cart])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cart_id: "current_cart_id", // Get from your cart context
          provider_id: "pp_stripe_stripe",
        }),
      })

      const data = await response.json()
      setClientSecret(data.payment_session.data.client_secret)
      setLoading(false)
    } catch (error) {
      console.error("Error creating payment intent:", error)
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push("/checkout/success")
  }

  if (loading) {
    return <div>Loading payment options...</div>
  }

  return (
    <StripeProvider>
      <div className="min-h-screen bg-background">
        {/* Your existing checkout layout */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Order summary and shipping form */}
          
          {clientSecret && (
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    </StripeProvider>
  )
}
```

## Webhook Setup

### Production Webhook Configuration

1. **Log in to Stripe Dashboard**
2. **Navigate to Developers → Webhooks**
3. **Click "Add endpoint"**
4. **Configure endpoint:**
   - Endpoint URL: `https://your-backend-domain.com/hooks/payment/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.succeeded`
     - `charge.failed`
     - `charge.refunded`
     - `charge.dispute.created`
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

5. **Copy the Signing secret** and add it to your `STRIPE_WEBHOOK_SECRET` environment variable

### Webhook Security Implementation

Create `backend/src/api/middleware/stripe-webhook.ts`:

```typescript
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import crypto from "crypto"

export const verifyStripeWebhook = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const signature = req.headers["stripe-signature"] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  if (!signature) {
    return res.status(401).json({ error: "No signature provided" })
  }

  try {
    // Verify the webhook signature
    const elements = signature.split(",")
    const timestamp = elements.find(e => e.startsWith("t="))?.split("=")[1]
    const signatures = elements.filter(e => e.startsWith("v1=")).map(e => e.split("=")[1])

    if (!timestamp || signatures.length === 0) {
      return res.status(401).json({ error: "Invalid signature format" })
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - parseInt(timestamp) > 300) {
      return res.status(401).json({ error: "Webhook timestamp too old" })
    }

    // Verify signature
    const payload = `${timestamp}.${req.body}`
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex")

    const isValid = signatures.some(sig => 
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
    )

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" })
    }

    next()
  } catch (error) {
    console.error("Webhook verification error:", error)
    return res.status(401).json({ error: "Webhook verification failed" })
  }
}
```

## Security Best Practices

### 1. API Key Management

```typescript
// backend/src/utils/stripe-security.ts
export class StripeSecurityManager {
  private static instance: StripeSecurityManager
  private stripe: Stripe

  private constructor() {
    // Validate API key format
    const apiKey = process.env.STRIPE_API_KEY
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('Invalid Stripe API key format')
    }

    // Initialize Stripe with security options
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
      maxNetworkRetries: 3,
      timeout: 30000, // 30 seconds
      telemetry: false, // Disable telemetry in production
    })
  }

  static getInstance(): StripeSecurityManager {
    if (!StripeSecurityManager.instance) {
      StripeSecurityManager.instance = new StripeSecurityManager()
    }
    return StripeSecurityManager.instance
  }

  getStripeClient(): Stripe {
    return this.stripe
  }
}
```

### 2. PCI Compliance Checklist

- ✅ Use Stripe Elements or Payment Element for card collection
- ✅ Never store card details on your servers
- ✅ Use HTTPS for all pages handling payment information
- ✅ Implement proper authentication and authorization
- ✅ Regular security updates and patches
- ✅ Implement fraud detection rules in Stripe Dashboard
- ✅ Use 3D Secure for high-risk transactions
- ✅ Monitor and log all payment activities

### 3. Fraud Prevention Configuration

```typescript
// backend/src/api/payment/fraud-prevention.ts
export const fraudPreventionRules = {
  // Block payments from high-risk countries
  blockedCountries: ['XX', 'YY'],
  
  // Require 3D Secure for payments above threshold
  threeDSecureThreshold: 100, // USD
  
  // Maximum payment attempts
  maxPaymentAttempts: 3,
  
  // Velocity checks
  velocityChecks: {
    maxTransactionsPerHour: 5,
    maxAmountPerDay: 5000,
  },
  
  // Address verification
  requireAddressVerification: true,
  requireCVCVerification: true,
}
```

## Testing in Production

### 1. Create Test Mode in Production

```typescript
// backend/src/api/payment/test-mode.ts
export const isTestMode = (customerId: string): boolean => {
  // Allow specific test customers in production
  const testCustomers = process.env.TEST_CUSTOMER_IDS?.split(',') || []
  return testCustomers.includes(customerId)
}

export const getStripeKey = (isTest: boolean): string => {
  return isTest 
    ? process.env.STRIPE_TEST_API_KEY! 
    : process.env.STRIPE_API_KEY!
}
```

### 2. Production Testing Checklist

- [ ] Test with real card in small amount
- [ ] Verify webhook delivery
- [ ] Test refund process
- [ ] Test dispute handling
- [ ] Verify multi-currency support
- [ ] Test all payment methods
- [ ] Verify error handling
- [ ] Test timeout scenarios
- [ ] Verify duplicate payment prevention

## Deployment Considerations

### 1. Railway/Render Configuration

```yaml
# railway.toml or render.yaml
services:
  - type: web
    name: medusa-backend
    env: node
    buildCommand: cd backend && yarn build
    startCommand: cd backend && yarn start
    envVars:
      - key: NODE_ENV
        value: production
      - key: STRIPE_API_KEY
        sync: false # Use secrets management
      - key: STRIPE_WEBHOOK_SECRET
        sync: false # Use secrets management
    healthCheckPath: /health
    
  - type: web
    name: nextjs-frontend
    env: node
    buildCommand: pnpm build
    startCommand: pnpm start
    envVars:
      - key: NEXT_PUBLIC_STRIPE_KEY
        value: pk_live_xxx # Public key is safe to expose
```

### 2. SSL/TLS Requirements

- Ensure all domains use HTTPS
- Configure SSL certificates for custom domains
- Set up proper CORS headers
- Implement HSTS headers

### 3. CORS Configuration

```typescript
// Production CORS settings
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://your-frontend-domain.com',
      'https://www.your-frontend-domain.com',
      'https://admin.your-domain.com',
    ]
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}
```

### 4. Monitoring and Alerts

```typescript
// backend/src/utils/payment-monitoring.ts
import { Logger } from "@medusajs/framework/types"

export class PaymentMonitor {
  constructor(private logger: Logger) {}

  logPaymentEvent(event: {
    type: string
    paymentId: string
    amount: number
    currency: string
    status: string
    error?: string
  }) {
    const logData = {
      timestamp: new Date().toISOString(),
      ...event,
    }

    if (event.error) {
      this.logger.error('Payment error', logData)
      // Send alert to monitoring service
      this.sendAlert(logData)
    } else {
      this.logger.info('Payment event', logData)
    }
  }

  private sendAlert(data: any) {
    // Integrate with your monitoring service (Sentry, DataDog, etc.)
  }
}
```

## Production Checklist

### Pre-Launch
- [ ] Replace all test API keys with production keys
- [ ] Configure production webhook endpoints in Stripe
- [ ] Set up proper domain and SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and alerting
- [ ] Test all payment flows with real cards
- [ ] Implement rate limiting for payment endpoints
- [ ] Set up database backups
- [ ] Configure fraud prevention rules in Stripe

### Post-Launch
- [ ] Monitor webhook delivery success rate
- [ ] Track payment success/failure rates
- [ ] Set up alerts for failed payments
- [ ] Regular security audits
- [ ] Keep Stripe SDK updated
- [ ] Monitor for suspicious activity
- [ ] Regular reconciliation with Stripe Dashboard

## Troubleshooting

### Common Issues and Solutions

1. **Webhook Signature Verification Fails**
   - Ensure you're using the correct webhook secret
   - Check that the raw request body is being used
   - Verify webhook endpoint URL matches Stripe configuration

2. **Payment Intent Creation Fails**
   - Verify API keys are correct
   - Check that amount is in smallest currency unit (cents)
   - Ensure customer email is valid

3. **3D Secure Not Triggering**
   - Enable 3D Secure in Stripe Dashboard
   - Set up rules for when to require authentication
   - Test with specific test cards that require 3DS

4. **CORS Errors**
   - Verify allowed origins include your frontend domain
   - Ensure credentials are included in requests
   - Check that OPTIONS requests are handled

## Support and Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Medusa Documentation](https://docs.medusajs.com)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [PCI Compliance Guide](https://stripe.com/docs/security/pci-compliance)