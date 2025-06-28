# Quick Start Guide - Hybrid Architecture Setup

## 🚀 Start Here - 30 Minute Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed locally (or use Docker)
- Git configured
- Basic knowledge of Next.js

### Step 1: Supabase Setup (5 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign in with GitHub
   - Create new project (remember your database password!)

2. **Get Your Keys**
   - Go to Settings → API
   - Copy `URL` and `anon public` key

3. **Add to Frontend `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   ```

### Step 2: Medusa Backend Setup (10 minutes)

1. **Create Backend Directory**
   ```bash
   cd ..
   mkdir indecisive-wear-backend
   cd indecisive-wear-backend
   ```

2. **Initialize Medusa**
   ```bash
   npx create-medusa-app@latest . --skip-db
   ```

3. **Configure Database**
   ```bash
   # Create .env file
   echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa_db" >> .env
   echo "REDIS_URL=redis://localhost:6379" >> .env
   ```

4. **Start Medusa**
   ```bash
   npm run dev
   # Medusa runs on http://localhost:9000
   # Admin panel on http://localhost:7001
   ```

### Step 3: Install Dependencies (2 minutes)

**In your Next.js frontend:**
```bash
cd ../indecisive-wear-store
pnpm add @medusajs/medusa-js @supabase/supabase-js
```

### Step 4: Create Database Schema (5 minutes)

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run this essential schema:

```sql
-- Essential tables for MVP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  product_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Review images
CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public review images" ON review_images FOR SELECT USING (true);
```

### Step 5: Create API Service (5 minutes)

Create `/lib/api/index.ts`:

```typescript
import Medusa from "@medusajs/medusa-js"
import { createClient } from '@supabase/supabase-js'

const medusa = new Medusa({
  baseUrl: 'http://localhost:9000',
  maxRetries: 3,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export { medusa, supabase }

// Quick test function
export async function testConnection() {
  try {
    // Test Medusa
    const { products } = await medusa.products.list()
    console.log('✅ Medusa connected:', products.length, 'products')
    
    // Test Supabase
    const { data, error } = await supabase.from('profiles').select('count')
    console.log('✅ Supabase connected')
    
    return { medusa: true, supabase: !error }
  } catch (error) {
    console.error('❌ Connection error:', error)
    return { medusa: false, supabase: false }
  }
}
```

### Step 6: Test Your Setup (3 minutes)

Create `/app/api/test/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/api'

export async function GET() {
  const status = await testConnection()
  return NextResponse.json(status)
}
```

Visit `http://localhost:3000/api/test` to verify both services are connected.

## 🎯 Next Immediate Steps

### Today
1. ✅ Complete the setup above
2. Create your first Medusa admin user:
   ```bash
   cd ../indecisive-wear-backend
   npx medusa user -e admin@indecisivewear.com -p your_password
   ```
3. Add a test product in Medusa Admin (http://localhost:7001)

### Tomorrow
1. Implement authentication flow
2. Connect product pages to real data
3. Replace mock reviews with Supabase data

### This Week
1. Shopping cart functionality
2. Checkout process
3. Review submission
4. Deploy to staging

## 🛠️ Troubleshooting

### Common Issues

**Medusa won't start:**
```bash
# Make sure PostgreSQL is running
pg_ctl status
# or
sudo service postgresql start

# Create database
createdb medusa_db
```

**Supabase connection error:**
- Check your API keys are correct
- Ensure RLS policies are set up
- Check Supabase dashboard for any issues

**CORS errors:**
Add to `medusa-config.js`:
```javascript
module.exports = {
  projectConfig: {
    store_cors: "http://localhost:3000",
    admin_cors: "http://localhost:3000",
  }
}
```

## 📚 Resources

- [Medusa Docs](https://docs.medusajs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Integration Examples](https://github.com/medusajs/medusa/tree/master/integration-tests)

## 💡 Pro Tips

1. **Use Medusa's seed command** for test data:
   ```bash
   npx medusa seed -f ./data/seed.json
   ```

2. **Enable Supabase Realtime** for live updates:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
   ```

3. **Set up GitHub Actions** for automated deployment

---

**Ready to code? You're all set! 🚀**

The full architecture documentation is available in:
- `BACKEND_ARCHITECTURE_ANALYSIS.md` - Deep technical analysis
- `HYBRID_ARCHITECTURE_IMPLEMENTATION.md` - Complete implementation guide
- `ARCHITECTURE_DECISION_SUMMARY.md` - Executive summary