# Hybrid Architecture Implementation Guide

## Quick Start Implementation

### Step 1: Initialize Medusa Backend

```bash
# Create a new directory for the backend
mkdir indecisive-wear-backend
cd indecisive-wear-backend

# Initialize Medusa
npx create-medusa-app@latest . --skip-db

# Configure PostgreSQL connection
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa_db" >> .env

# Install additional dependencies
npm install @supabase/supabase-js
```

### Step 2: Set Up Supabase Project

1. Create a new Supabase project at https://supabase.com
2. Get your project URL and anon key
3. Add to your Next.js `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Database Schema Setup

Run this in Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  instagram_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  order_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT,
  size_purchased TEXT,
  fit TEXT CHECK (fit IN ('Runs Small', 'True to Size', 'Runs Large')),
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Review images
CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Review votes
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(review_id, user_id)
);

-- Wishlists
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Wishlist',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Wishlist items
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  notes TEXT,
  UNIQUE(wishlist_id, product_id, variant_id)
);

-- Social posts queue
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'twitter', 'facebook')),
  content TEXT NOT NULL,
  image_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
  posted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Reviews: Anyone can read, authenticated users can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Review images: Same as reviews
CREATE POLICY "Review images are viewable by everyone" ON review_images
  FOR SELECT USING (true);

CREATE POLICY "Review authors can add images" ON review_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE reviews.id = review_images.review_id 
      AND reviews.user_id = auth.uid()
    )
  );

-- Wishlists: Users can manage their own
CREATE POLICY "Users can view own wishlists" ON wishlists
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own wishlists" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlists" ON wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_review_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET 
    helpful_count = (
      SELECT COUNT(*) FROM review_votes 
      WHERE review_id = NEW.review_id AND is_helpful = true
    ),
    not_helpful_count = (
      SELECT COUNT(*) FROM review_votes 
      WHERE review_id = NEW.review_id AND is_helpful = false
    )
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_counts
AFTER INSERT OR UPDATE OR DELETE ON review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_vote_counts();
```

### Step 4: Unified API Service

Create `/lib/api/unified-commerce.ts`:

```typescript
import Medusa from "@medusajs/medusa-js"
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface ReviewWithUser {
  id: string
  rating: number
  title: string
  content: string
  size_purchased: string
  fit: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  user: {
    username: string
    avatar_url: string
  }
  images: {
    id: string
    image_url: string
  }[]
}

export class UnifiedCommerceAPI {
  private medusa: Medusa
  private supabase: SupabaseClient
  private static instance: UnifiedCommerceAPI

  private constructor() {
    this.medusa = new Medusa({
      baseUrl: process.env.NEXT_PUBLIC_MEDUSA_URL || 'http://localhost:9000',
      maxRetries: 3,
    })
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  static getInstance(): UnifiedCommerceAPI {
    if (!UnifiedCommerceAPI.instance) {
      UnifiedCommerceAPI.instance = new UnifiedCommerceAPI()
    }
    return UnifiedCommerceAPI.instance
  }

  // Authentication
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) throw error

    // Create Medusa customer
    if (data.user) {
      await this.medusa.customers.create({
        email,
        first_name: metadata?.first_name,
        last_name: metadata?.last_name,
      })
    }

    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Get or create Medusa session
    if (data.user) {
      const customers = await this.medusa.customers.list({ email })
      if (customers.customers.length === 0) {
        await this.medusa.customers.create({ email })
      }
    }

    return data
  }

  // Products with social data
  async getProduct(handle: string) {
    // Get product from Medusa
    const { products } = await this.medusa.products.list({ handle })
    
    if (!products.length) {
      throw new Error('Product not found')
    }

    const product = products[0]
    
    // Get reviews from Supabase
    const { data: reviews, error } = await this.supabase
      .from('reviews')
      .select(`
        *,
        user:profiles!inner(username, avatar_url),
        images:review_images(id, image_url)
      `)
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate aggregates
    const totalReviews = reviews?.length || 0
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews?.filter(r => r.rating === rating).length || 0
    }))

    return {
      ...product,
      reviews: reviews as ReviewWithUser[],
      totalReviews,
      averageRating,
      ratingDistribution
    }
  }

  // Cart operations with user association
  async createCart(userId?: string) {
    const cart = await this.medusa.carts.create({})
    
    if (userId) {
      // Associate cart with Supabase user
      // This would be stored in a junction table in production
      sessionStorage.setItem(`cart_${userId}`, cart.cart.id)
    }

    return cart.cart
  }

  async getCart(userId?: string) {
    let cartId = sessionStorage.getItem('cart_id')
    
    if (userId) {
      const userCartId = sessionStorage.getItem(`cart_${userId}`)
      if (userCartId) cartId = userCartId
    }

    if (!cartId) {
      const cart = await this.createCart(userId)
      return cart
    }

    try {
      const { cart } = await this.medusa.carts.retrieve(cartId)
      return cart
    } catch (error) {
      // Cart not found, create new one
      const cart = await this.createCart(userId)
      return cart
    }
  }

  // Wishlist operations
  async getWishlist(userId: string) {
    const { data, error } = await this.supabase
      .from('wishlists')
      .select(`
        *,
        items:wishlist_items(*)
      `)
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // No wishlist found, create one
      const { data: newWishlist } = await this.supabase
        .from('wishlists')
        .insert({ user_id: userId })
        .select()
        .single()
      
      return { ...newWishlist, items: [] }
    }

    if (error) throw error
    return data
  }

  async addToWishlist(userId: string, productId: string, variantId?: string) {
    const wishlist = await this.getWishlist(userId)
    
    const { data, error } = await this.supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlist.id,
        product_id: productId,
        variant_id: variantId
      })
      .select()

    if (error) throw error
    return data
  }

  // Review operations
  async createReview(review: {
    userId: string
    productId: string
    rating: number
    title: string
    content: string
    sizePurchased: string
    fit: string
    images?: File[]
  }) {
    // Insert review
    const { data: newReview, error } = await this.supabase
      .from('reviews')
      .insert({
        user_id: review.userId,
        product_id: review.productId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        size_purchased: review.sizePurchased,
        fit: review.fit
      })
      .select()
      .single()

    if (error) throw error

    // Upload images if provided
    if (review.images && review.images.length > 0) {
      for (let i = 0; i < review.images.length; i++) {
        const file = review.images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${review.userId}/${newReview.id}/${i}.${fileExt}`
        
        const { error: uploadError } = await this.supabase.storage
          .from('review-images')
          .upload(fileName, file)

        if (!uploadError) {
          const { data: { publicUrl } } = this.supabase.storage
            .from('review-images')
            .getPublicUrl(fileName)

          await this.supabase
            .from('review_images')
            .insert({
              review_id: newReview.id,
              image_url: publicUrl,
              storage_path: fileName,
              order_index: i
            })
        }
      }
    }

    return newReview
  }

  // Order sync for verified purchases
  async syncOrderWithReviews(orderId: string, customerId: string) {
    try {
      // Get order from Medusa
      const order = await this.medusa.orders.retrieve(orderId)
      
      // Get Supabase user by email
      const { data: users } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', order.email)
        .single()

      if (users) {
        // Mark reviews as verified for purchased products
        const productIds = order.items.map(item => item.variant.product_id)
        
        await this.supabase
          .from('reviews')
          .update({ 
            verified_purchase: true,
            order_id: orderId 
          })
          .eq('user_id', users.id)
          .in('product_id', productIds)
      }
    } catch (error) {
      console.error('Failed to sync order with reviews:', error)
    }
  }
}

// Export singleton instance
export const api = UnifiedCommerceAPI.getInstance()
```

### Step 5: Update Frontend Components

Update components to use the unified API:

```typescript
// Example: Update reviews section
import { api } from '@/lib/api/unified-commerce'

export function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchReviews() {
      try {
        const product = await api.getProduct(productId)
        setReviews(product.reviews)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReviews()
  }, [productId])
  
  // Rest of component...
}
```

### Step 6: Webhook Integration

Create `/app/api/webhooks/medusa/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event, data } = body

  switch (event) {
    case 'order.placed':
      // Sync with Supabase for verified purchase badges
      await syncOrderWithSupabase(data)
      break
      
    case 'customer.created':
      // Create profile in Supabase
      await createSupabaseProfile(data)
      break
      
    default:
      console.log(`Unhandled event: ${event}`)
  }

  return NextResponse.json({ received: true })
}

async function syncOrderWithSupabase(order: any) {
  // Implementation here
}

async function createSupabaseProfile(customer: any) {
  // Implementation here
}
```

## Deployment Strategy

### Development Environment
1. Medusa: Local Docker container
2. Supabase: Free tier project
3. Next.js: Local development server

### Production Environment

#### Option 1: Vercel + Railway + Supabase
- Next.js Frontend: Vercel
- Medusa Backend: Railway
- Database & Auth: Supabase
- Cost: ~$20-50/month

#### Option 2: AWS Full Stack
- Next.js: AWS Amplify
- Medusa: ECS Fargate
- Database: RDS + Supabase
- Cost: ~$50-100/month

#### Option 3: DigitalOcean App Platform
- All services on DO App Platform
- Managed PostgreSQL
- Cost: ~$40-80/month

## Monitoring & Maintenance

### Essential Monitoring
1. **Sentry** for error tracking
2. **Vercel Analytics** for performance
3. **Supabase Dashboard** for database metrics
4. **Medusa Admin** for order monitoring

### Backup Strategy
1. Daily Medusa database backups
2. Supabase automatic backups (included)
3. Weekly full system snapshots

## Security Checklist

- [ ] Enable RLS on all Supabase tables
- [ ] Configure CORS properly
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on admin accounts
- [ ] Regular dependency updates
- [ ] API rate limiting
- [ ] Input validation on all forms
- [ ] XSS protection headers

## Next Steps

1. **Week 1**: Set up development environment
2. **Week 2**: Implement authentication flow
3. **Week 3**: Product catalog and cart
4. **Week 4**: Reviews and social features
5. **Week 5**: Payment integration
6. **Week 6**: Testing and deployment

This architecture provides the perfect balance of rapid development, scalability, and feature richness for Indecisive Wear's unique requirements.