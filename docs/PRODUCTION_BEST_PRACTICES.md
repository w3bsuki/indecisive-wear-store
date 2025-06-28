# Production Best Practices Guide for E-commerce Tech Stack

## Table of Contents
1. [Next.js 15 Best Practices](#nextjs-15-best-practices)
2. [shadcn/ui Component Architecture](#shadcnui-component-architecture)
3. [TypeScript Strict Mode](#typescript-strict-mode)
4. [E-commerce Architecture Patterns](#e-commerce-architecture-patterns)
5. [Medusa v2 Production Setup](#medusa-v2-production-setup)
6. [Supabase Integration](#supabase-integration)
7. [Code Quality & Security](#code-quality--security)

---

## 1. Next.js 15 Best Practices

### App Router Optimization

#### Route Organization
```typescript
// ✅ DO: Organize routes by feature with proper grouping
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (shop)/
│   ├── products/
│   ├── cart/
│   └── layout.tsx
└── admin/
    └── middleware.ts

// ❌ DON'T: Mix unrelated routes without grouping
app/
├── login/
├── products/
├── admin/
└── cart/
```

#### Loading States & Suspense Boundaries
```typescript
// app/products/loading.tsx
import { ProductSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}

// app/products/page.tsx
import { Suspense } from 'react'
import { ProductList } from '@/components/product-list'

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductList />
    </Suspense>
  )
}
```

### Performance Patterns

#### Server Components by Default
```typescript
// ✅ DO: Keep components server-side unless interaction needed
// app/products/[id]/page.tsx
import { getProduct } from '@/lib/medusa'
import { AddToCartButton } from './add-to-cart-button' // Client component

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <AddToCartButton productId={product.id} /> {/* Only this is client-side */}
    </div>
  )
}

// ❌ DON'T: Make entire pages client components unnecessarily
'use client'
export default function ProductPage() { // Entire page runs on client
  // ...
}
```

#### Static Generation with ISR
```typescript
// app/products/[id]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({
    id: product.id,
  }))
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  return <ProductDetail product={product} />
}
```

### Image Optimization
```typescript
// ✅ DO: Use next/image with proper sizing
import Image from 'next/image'

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false} // Only use priority for above-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." // Generate with plaiceholder
    />
  )
}

// ❌ DON'T: Use unoptimized images
<img src="/product.jpg" alt="Product" />
```

### Font Optimization
```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Middleware Best Practices
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Performance: Early return for static assets
  if (request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Authentication check for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Route Handlers Best Practices
```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))
    
    // Implement caching
    const products = await getProducts(query)
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

---

## 2. shadcn/ui Component Architecture

### Component Organization
```typescript
// components/ui/ - Base shadcn/ui components (don't modify directly)
// components/   - Your custom components

// ✅ DO: Extend shadcn/ui components properly
// components/product-card.tsx
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <h3 className="font-semibold">{product.name}</h3>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground">{product.description}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  )
}
```

### Theme Customization
```css
/* app/globals.css */
@layer base {
  :root {
    /* Brand colors */
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    
    /* Semantic colors */
    --success: 142 76% 36%;
    --success-foreground: 0 0% 98%;
    
    /* E-commerce specific */
    --price: 346 77% 49%;
    --discount: 25 95% 53%;
  }
  
  .dark {
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
  }
}

/* Custom utility classes */
@layer utilities {
  .price {
    @apply text-[hsl(var(--price))] font-semibold;
  }
  
  .discount {
    @apply text-[hsl(var(--discount))] font-medium;
  }
}
```

### Accessibility Compliance
```typescript
// ✅ DO: Ensure proper ARIA labels and keyboard navigation
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export function ProductActions({ product }: { product: Product }) {
  return (
    <div role="group" aria-label="Product actions">
      <Button
        aria-label={`Add ${product.name} to cart`}
        onClick={() => addToCart(product.id)}
      >
        Add to Cart
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Add ${product.name} to wishlist`}
      >
        <Heart className="h-4 w-4" />
        <VisuallyHidden>Add to wishlist</VisuallyHidden>
      </Button>
    </div>
  )
}
```

### Form Handling with React Hook Form + Zod
```typescript
// ✅ DO: Type-safe forms with validation
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
    country: z.string().min(1, 'Country is required'),
  }),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number'),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      fullName: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        postalCode: '',
        country: 'US',
      },
      phone: '',
    },
  })

  async function onSubmit(data: CheckoutForm) {
    try {
      await createOrder(data)
    } catch (error) {
      form.setError('root', {
        message: 'Failed to process order. Please try again.',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                We'll send order updates to this email
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* More fields... */}
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Processing...' : 'Place Order'}
        </Button>
      </form>
    </Form>
  )
}
```

### Component Composition Patterns
```typescript
// ✅ DO: Use compound components for flexibility
import { createContext, useContext } from 'react'

const ProductContext = createContext<Product | null>(null)

export function Product({ product, children }: { product: Product; children: React.ReactNode }) {
  return (
    <ProductContext.Provider value={product}>
      <div className="product">{children}</div>
    </ProductContext.Provider>
  )
}

Product.Image = function ProductImage() {
  const product = useContext(ProductContext)!
  return <Image src={product.image} alt={product.name} />
}

Product.Title = function ProductTitle() {
  const product = useContext(ProductContext)!
  return <h2 className="text-2xl font-bold">{product.name}</h2>
}

Product.Price = function ProductPrice() {
  const product = useContext(ProductContext)!
  return <span className="price">${product.price}</span>
}

// Usage
<Product product={product}>
  <Product.Image />
  <Product.Title />
  <Product.Price />
</Product>
```

---

## 3. TypeScript Strict Mode

### Production tsconfig.json
```json
{
  "compilerOptions": {
    // Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // Module Resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    
    // Emit
    "noEmit": true,
    "incremental": true,
    
    // JavaScript Support
    "allowJs": true,
    "checkJs": true,
    
    // Skip Lib Check
    "skipLibCheck": true,
    
    // Interop Constraints
    "forceConsistentCasingInFileNames": true,
    
    // Language and Environment
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    
    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist", "build", ".next"]
}
```

### Type Safety Best Practices

#### API Response Typing
```typescript
// types/api.ts
// ✅ DO: Define comprehensive types for API responses
export interface ApiResponse<T> {
  data: T
  meta: {
    timestamp: string
    version: string
  }
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// lib/api-client.ts
class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.message, error.code, response.status)
    }

    return response.json()
  }

  async getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    const queryString = new URLSearchParams(params as any).toString()
    return this.request<Product[]>(`/products?${queryString}`)
  }
}
```

#### Generic Patterns for Reusable Components
```typescript
// ✅ DO: Use generics for type-safe reusable components
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (row: T) => void
  keyExtractor: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? 'cursor-pointer' : undefined}
          >
            {columns.map((column) => (
              <TableCell key={column.id}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Usage with type inference
const productColumns: ColumnDef<Product>[] = [
  { id: 'name', header: 'Name', cell: (p) => p.name },
  { id: 'price', header: 'Price', cell: (p) => `$${p.price}` },
]

<DataTable
  data={products}
  columns={productColumns}
  keyExtractor={(p) => p.id}
  onRowClick={(product) => router.push(`/products/${product.id}`)}
/>
```

#### Discriminated Unions for State Management
```typescript
// ✅ DO: Use discriminated unions for complex state
type CartState =
  | { status: 'idle'; items: CartItem[] }
  | { status: 'loading'; items: CartItem[] }
  | { status: 'updating'; itemId: string; items: CartItem[] }
  | { status: 'error'; error: string; items: CartItem[] }
  | { status: 'success'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      if (state.status === 'loading') return state
      
      return {
        ...state,
        status: 'updating',
        itemId: action.payload.id,
      }
      
    case 'ADD_ITEM_SUCCESS':
      return {
        status: 'success',
        items: [...state.items, action.payload],
      }
      
    case 'ADD_ITEM_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      }
      
    default:
      return state
  }
}
```

---

## 4. E-commerce Architecture Patterns

### Shopping Cart State Management
```typescript
// contexts/cart-context.tsx
import { createContext, useContext, useReducer, useEffect } from 'react'
import { z } from 'zod'

const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().min(1),
  price: z.number(),
  metadata: z.record(z.unknown()).optional(),
})

type CartItem = z.infer<typeof CartItemSchema>

interface CartState {
  items: CartItem[]
  isLoading: boolean
  error: string | null
}

type CartAction =
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CART' }

const CartContext = createContext<{
  state: CartState
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clearCart: () => Promise<void>
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false }
      
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId &&
                  item.variantId === action.payload.variantId
      )
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        }
      }
      
      return { ...state, items: [...state.items, action.payload] }
    }
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      }
      
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      }
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
      
    case 'SET_ERROR':
      return { ...state, error: action.payload }
      
    case 'CLEAR_CART':
      return { ...state, items: [] }
      
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isLoading: true,
    error: null,
  })

  // Persist cart to localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart)
        const validatedItems = z.array(CartItemSchema).parse(items)
        dispatch({ type: 'SET_ITEMS', payload: validatedItems })
      } catch (error) {
        console.error('Invalid cart data in localStorage')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('cart', JSON.stringify(state.items))
    }
  }, [state.items, state.isLoading])

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Validate stock availability
      const isAvailable = await checkStock(item.productId, item.quantity)
      if (!isAvailable) {
        throw new Error('Insufficient stock')
      }
      
      const cartItem: CartItem = {
        ...item,
        id: crypto.randomUUID(),
      }
      
      dispatch({ type: 'ADD_ITEM', payload: cartItem })
      
      // Sync with backend
      await syncCartWithBackend(state.items)
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to add item' 
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // ... other methods

  return (
    <CartContext.Provider value={{ state, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
```

### Payment Flow Security
```typescript
// lib/payment/stripe-handler.ts
import { loadStripe, Stripe } from '@stripe/stripe-js'

class StripePaymentHandler {
  private stripePromise: Promise<Stripe | null>

  constructor() {
    this.stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    const response = await fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': await this.getCSRFToken(),
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata: {
          orderId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create payment intent')
    }

    return response.json()
  }

  async confirmPayment(clientSecret: string, paymentElement: any) {
    const stripe = await this.stripePromise
    if (!stripe) throw new Error('Stripe not loaded')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements: paymentElement,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      throw new Error(error.message)
    }

    return paymentIntent
  }

  private async getCSRFToken(): Promise<string> {
    const response = await fetch('/api/csrf-token')
    const { token } = await response.json()
    return token
  }
}

// Payment form component with 3D Secure handling
export function PaymentForm({ amount }: { amount: number }) {
  const [clientSecret, setClientSecret] = useState<string>()
  const [error, setError] = useState<string>()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const handler = new StripePaymentHandler()
    handler.createPaymentIntent(amount)
      .then(({ clientSecret }) => setClientSecret(clientSecret))
      .catch((err) => setError(err.message))
  }, [amount])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setProcessing(true)

    try {
      // Confirm payment with 3D Secure if required
      const result = await handler.confirmPayment(clientSecret!, elements)
      
      // Handle successful payment
      await completeOrder(result.id)
      router.push('/checkout/success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button type="submit" disabled={processing}>
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </Button>
    </form>
  )
}
```

### User Authentication Patterns
```typescript
// lib/auth/auth-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        isLoading: false,
      }))
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
      }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Sync cart after login
      await syncCartAfterAuth(data.user.id)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }))
      throw error
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Create customer profile in Medusa
      await createCustomerProfile(data.user!.id, email, metadata)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign up failed',
      }))
      throw error
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // ... other methods

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Protected route component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

### Product Catalog Optimization
```typescript
// lib/products/product-service.ts
import { cache } from 'react'

interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'price' | 'name' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

// Cache product queries for the request duration
export const getProducts = cache(async (filters?: ProductFilters) => {
  const params = new URLSearchParams()
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
  }

  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/products?${params}`, {
    next: {
      revalidate: 300, // Cache for 5 minutes
      tags: ['products'],
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }

  return response.json()
})

// Optimized product search with debouncing
export function useProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.products)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  return { query, setQuery, results, isSearching }
}

// Virtual scrolling for large product lists
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualProductGrid({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const columnCount = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 })

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(products.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated row height
    overscan: 2,
  })

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount
          const endIndex = Math.min(startIndex + columnCount, products.length)
          const rowProducts = products.slice(startIndex, endIndex)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rowProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 5. Medusa v2 Production Setup

### Database Configuration
```typescript
// medusa-config.ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    database_extra: process.env.NODE_ENV === 'production' ? {
      ssl: {
        rejectUnauthorized: false,
      },
      // Connection pooling for production
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    } : {},
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    // Disable admin in production if using custom admin
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    path: process.env.MEDUSA_ADMIN_PATH || '/admin',
  },
  modules: {
    // Enable Redis for caching and events in production
    cacheService: {
      resolve: '@medusajs/cache-redis',
      options: {
        redisUrl: process.env.REDIS_URL,
        ttl: 300, // 5 minutes default TTL
      },
    },
    eventBusService: {
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
  },
})
```

### Custom Modules Best Practices
```typescript
// src/modules/inventory/index.ts
import { Module } from '@medusajs/framework/utils'

export const InventoryModule = Module({
  imports: [
    // Import other modules
  ],
  providers: [
    {
      resolve: './services/inventory.service',
      id: 'inventory-service',
    },
    {
      resolve: './repositories/inventory.repository',
      id: 'inventory-repository',
    },
  ],
})

// src/modules/inventory/services/inventory.service.ts
import { Injectable } from '@medusajs/framework/utils'
import { EntityManager } from '@mikro-orm/core'

@Injectable()
export class InventoryService {
  constructor(
    private readonly manager: EntityManager,
    private readonly inventoryRepo: InventoryRepository
  ) {}

  async reserveStock(
    productId: string,
    quantity: number,
    reservationId: string
  ): Promise<void> {
    return this.manager.transactional(async (em) => {
      const inventory = await this.inventoryRepo.findOneOrFail(
        { product_id: productId },
        { lockMode: 'pessimistic_write' }
      )

      if (inventory.available_quantity < quantity) {
        throw new Error('Insufficient stock')
      }

      inventory.available_quantity -= quantity
      inventory.reserved_quantity += quantity

      await em.persist(inventory).flush()

      // Create reservation record
      await this.createReservation(reservationId, productId, quantity)
    })
  }

  async releaseStock(reservationId: string): Promise<void> {
    return this.manager.transactional(async (em) => {
      const reservation = await this.getReservation(reservationId)
      
      const inventory = await this.inventoryRepo.findOneOrFail(
        { product_id: reservation.product_id },
        { lockMode: 'pessimistic_write' }
      )

      inventory.available_quantity += reservation.quantity
      inventory.reserved_quantity -= reservation.quantity

      await em.persist(inventory).flush()
      await this.deleteReservation(reservationId)
    })
  }
}
```

### Workflow Implementation
```typescript
// src/workflows/order-fulfillment.workflow.ts
import { 
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse
} from '@medusajs/framework/workflows-sdk'

const validateInventoryStep = createStep(
  'validate-inventory',
  async ({ items }: { items: OrderItem[] }) => {
    const inventoryService = container.resolve('inventory-service')
    
    for (const item of items) {
      const hasStock = await inventoryService.checkAvailability(
        item.product_id,
        item.quantity
      )
      
      if (!hasStock) {
        throw new Error(`Insufficient stock for product ${item.product_id}`)
      }
    }
    
    return new StepResponse({ validated: true })
  }
)

const reserveInventoryStep = createStep(
  'reserve-inventory',
  async ({ orderId, items }: { orderId: string; items: OrderItem[] }) => {
    const inventoryService = container.resolve('inventory-service')
    
    const reservations = []
    
    for (const item of items) {
      const reservationId = `${orderId}-${item.id}`
      await inventoryService.reserveStock(
        item.product_id,
        item.quantity,
        reservationId
      )
      reservations.push(reservationId)
    }
    
    return new StepResponse(
      { reservations },
      { reservations } // Compensation data
    )
  },
  async ({ reservations }) => {
    // Compensation: Release reserved stock
    const inventoryService = container.resolve('inventory-service')
    
    for (const reservationId of reservations) {
      await inventoryService.releaseStock(reservationId)
    }
  }
)

const createShipmentStep = createStep(
  'create-shipment',
  async ({ order }: { order: Order }) => {
    const fulfillmentService = container.resolve('fulfillment-service')
    
    const shipment = await fulfillmentService.createShipment({
      order_id: order.id,
      items: order.items,
      shipping_address: order.shipping_address,
      shipping_method: order.shipping_method,
    })
    
    return new StepResponse(
      { shipment },
      { shipmentId: shipment.id }
    )
  },
  async ({ shipmentId }) => {
    // Compensation: Cancel shipment
    const fulfillmentService = container.resolve('fulfillment-service')
    await fulfillmentService.cancelShipment(shipmentId)
  }
)

export const orderFulfillmentWorkflow = createWorkflow(
  'order-fulfillment',
  function (input: { orderId: string }) {
    const order = getOrderStep(input.orderId)
    
    validateInventoryStep({ items: order.items })
    
    const { reservations } = reserveInventoryStep({
      orderId: order.id,
      items: order.items,
    })
    
    const { shipment } = createShipmentStep({ order })
    
    return new WorkflowResponse({
      order,
      reservations,
      shipment,
    })
  }
)
```

### Performance Optimization
```typescript
// src/api/middleware/cache.ts
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from '@medusajs/framework'

export const cacheMiddleware = (ttl: number = 300) => {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const cacheService = req.scope.resolve('cacheService')
    const cacheKey = `api:${req.originalUrl}`

    try {
      // Check cache
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        res.set('X-Cache', 'HIT')
        return res.json(cached)
      }

      // Store original json method
      const originalJson = res.json.bind(res)

      // Override json method to cache response
      res.json = function (data: any) {
        res.set('X-Cache', 'MISS')
        
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch(console.error)
        
        return originalJson(data)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Usage in routes
router.get(
  '/store/products',
  cacheMiddleware(600), // Cache for 10 minutes
  async (req, res) => {
    const products = await productService.list(req.query)
    res.json({ products })
  }
)
```

---

## 6. Supabase Integration

### Row Level Security (RLS) Setup
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders table policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Cart items policies
CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin policies using custom claims
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');
```

### Real-time Subscriptions Optimization
```typescript
// lib/supabase/realtime-hooks.ts
import { useEffect, useRef, useCallback } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from './client'

interface UseRealtimeOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  filter?: string
  debounceMs?: number
}

export function useRealtimeSubscription<T>(
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  options: UseRealtimeOptions = {}
) {
  const {
    event = '*',
    schema = 'public',
    filter,
    debounceMs = 0,
  } = options

  const channelRef = useRef<RealtimeChannel | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedCallback = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      if (debounceMs > 0) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          callback(payload)
        }, debounceMs)
      } else {
        callback(payload)
      }
    },
    [callback, debounceMs]
  )

  useEffect(() => {
    // Create channel with unique name
    const channelName = `${table}-${event}-${filter || 'all'}-${Date.now()}`
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter,
        },
        debouncedCallback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`)
        }
      })

    return () => {
      clearTimeout(timeoutRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, event, schema, filter, debouncedCallback])
}

// Optimized hook for inventory updates
export function useInventoryUpdates(productIds: string[]) {
  const [inventory, setInventory] = useState<Map<string, number>>(new Map())

  useRealtimeSubscription<InventoryRecord>(
    'inventory',
    (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        setInventory((prev) => {
          const next = new Map(prev)
          next.set(payload.new.product_id, payload.new.available_quantity)
          return next
        })
      }
    },
    {
      event: 'UPDATE',
      filter: productIds.length > 0 
        ? `product_id=in.(${productIds.join(',')})` 
        : undefined,
      debounceMs: 500, // Debounce rapid updates
    }
  )

  // Initial fetch
  useEffect(() => {
    if (productIds.length === 0) return

    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('product_id, available_quantity')
        .in('product_id', productIds)

      if (data && !error) {
        const inventoryMap = new Map(
          data.map((item) => [item.product_id, item.available_quantity])
        )
        setInventory(inventoryMap)
      }
    }

    fetchInventory()
  }, [productIds])

  return inventory
}
```

### File Storage Best Practices
```typescript
// lib/supabase/storage.ts
import { supabase } from './client'

interface UploadOptions {
  bucket: string
  path: string
  file: File
  onProgress?: (progress: number) => void
}

export class StorageService {
  private static instance: StorageService
  
  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService()
    }
    return this.instance
  }

  async uploadProductImage(
    productId: string,
    file: File,
    variant?: string
  ): Promise<string> {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size must be less than 5MB')
    }

    // Generate optimized filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = variant 
      ? `${productId}/${variant}-${timestamp}.${extension}`
      : `${productId}/main-${timestamp}.${extension}`

    // Upload with progress tracking
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path)

    return publicUrl
  }

  async uploadWithProgress({ bucket, path, file, onProgress }: UploadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(response.Key)
          resolve(publicUrl)
        } else {
          reject(new Error('Upload failed'))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      // Get upload URL
      supabase.storage
        .from(bucket)
        .createSignedUploadUrl(path)
        .then(({ data, error }) => {
          if (error || !data) {
            reject(error || new Error('Failed to create upload URL'))
            return
          }

          xhr.open('PUT', data.signedUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })
    })
  }

  // Image transformation for responsive images
  getOptimizedImageUrl(url: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif'
  }): string {
    const params = new URLSearchParams()
    
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())
    if (options.format) params.append('format', options.format)

    return `${url}?${params.toString()}`
  }
}

// React hook for file uploads
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (
    file: File,
    options: Omit<UploadOptions, 'file' | 'onProgress'>
  ) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const storage = StorageService.getInstance()
      const url = await storage.uploadWithProgress({
        ...options,
        file,
        onProgress: setProgress,
      })

      setUploading(false)
      return url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
      throw err
    }
  }, [])

  return { upload, uploading, progress, error }
}
```

### Database Schema Design Patterns
```sql
-- Optimized e-commerce schema with Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE order_status AS ENUM (
  'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'succeeded', 'failed', 'refunded'
);

-- Customers table (extends auth.users)
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table with full-text search
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  compare_at_price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  weight DECIMAL(10, 3),
  metadata JSONB DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIN index for full-text search
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Inventory tracking with optimistic locking
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1, -- For optimistic locking
  CONSTRAINT available_quantity CHECK (quantity >= reserved_quantity),
  UNIQUE(product_id, location_id)
);

-- Orders with computed columns
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT generate_order_number(),
  customer_id UUID REFERENCES customers(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) GENERATED ALWAYS AS (
    subtotal + tax_amount + shipping_amount - discount_amount
  ) STORED,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items with automatic subtotal calculation
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || 
         LPAD(nextval('order_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq START 1;

-- Trigger to update order subtotal
CREATE OR REPLACE FUNCTION update_order_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET subtotal = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_subtotal_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_subtotal();

-- Audit trail
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic audit function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    user_id,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    inet_client_addr(),
    current_setting('application.user_agent', true)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 7. Code Quality & Security

### ESLint Configuration for Production
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:security/recommended',
    'plugin:sonarjs/recommended',
    'next/core-web-vitals',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'jsx-a11y',
    'security',
    'sonarjs',
    'import',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
    }],
    
    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    
    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    
    // Import order
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    
    // General
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

### Prettier Setup
```javascript
// .prettierrc.js
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.ts',
}
```

### Git Hooks and Pre-commit Checks
```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run type checking
npm run type-check

# Run lint-staged
npx lint-staged

# Run security audit
npm audit --production --audit-level=high
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx commitlint --edit $1
```

### Environment Variable Management
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // CORS
  STORE_CORS: z.string(),
  ADMIN_CORS: z.string(),
  
  // Optional
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_ID: z.string().optional(),
})

// Validate environment variables at build time
const env = envSchema.parse(process.env)

export default env

// Type-safe environment variable access
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
```

### API Security Best Practices
```typescript
// middleware/security.ts
import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/rate-limiter'
import { validateCSRFToken } from '@/lib/csrf'

const rateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function securityMiddleware(request: NextRequest) {
  // Rate limiting
  const identifier = request.ip ?? 'anonymous'
  const { success } = await rateLimiter.check(identifier, 10) // 10 requests per minute
  
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // CSRF protection for mutations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token')
    
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return new NextResponse('Invalid CSRF Token', { status: 403 })
    }
  }

  // Security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  )
  
  return response
}

// lib/rate-limiter.ts
import { LRUCache } from 'lru-cache'

export class RateLimiter {
  private cache: LRUCache<string, number[]>

  constructor(options: { interval: number; uniqueTokenPerInterval: number }) {
    this.cache = new LRUCache<string, number[]>({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval,
    })
  }

  async check(identifier: string, limit: number): Promise<{ success: boolean }> {
    const tokenCount = this.cache.get(identifier) || []
    const now = Date.now()
    const validTokens = tokenCount.filter((timestamp) => now - timestamp < this.cache.ttl)

    if (validTokens.length >= limit) {
      return { success: false }
    }

    validTokens.push(now)
    this.cache.set(identifier, validTokens)
    
    return { success: true }
  }
}
```

### Production Deployment Guidelines

#### Dockerfile for Next.js
```dockerfile
# Multi-stage build for optimized production image
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Security Checklist

**Authentication & Authorization**
- [ ] Implement proper JWT validation
- [ ] Use secure session management
- [ ] Enable MFA for admin accounts
- [ ] Implement role-based access control
- [ ] Set appropriate token expiration times

**Data Protection**
- [ ] Enable SSL/TLS everywhere
- [ ] Encrypt sensitive data at rest
- [ ] Use parameterized queries
- [ ] Implement input validation
- [ ] Sanitize user inputs

**API Security**
- [ ] Implement rate limiting
- [ ] Use API versioning
- [ ] Enable CORS properly
- [ ] Validate webhook signatures
- [ ] Implement request signing

**Infrastructure**
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Implement DDoS protection
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

**Compliance**
- [ ] GDPR compliance for EU customers
- [ ] PCI DSS for payment processing
- [ ] Privacy policy and terms of service
- [ ] Cookie consent management
- [ ] Data retention policies

---

## Performance Optimization Techniques

### Bundle Size Optimization
```javascript
// next.config.mjs
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Optimize builds
  experimental: {
    optimizeCss: true,
    legacyBrowsers: false,
  },
  
  // Module aliases for smaller imports
  modularizeImports: {
    '@heroicons/react': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    'lodash': {
      transform: 'lodash/{{member}}',
    },
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Tree shaking
    config.optimization.usedExports = true
    
    // Split chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
            },
            name(module) {
              const hash = crypto.createHash('sha1')
              hash.update(module.identifier())
              return hash.digest('hex').substring(0, 8)
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'initial',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex')
                .substring(0, 8)
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      }
    }
    
    return config
  },
}

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    silent: true,
    org: 'your-org',
    project: 'your-project',
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
)
```

This comprehensive guide covers all the essential best practices for building a production-ready e-commerce store with your tech stack. Each section includes practical code examples, security considerations, and performance optimizations that you can implement immediately.