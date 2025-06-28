# 🚀 PRODUCTION DEPLOYMENT REQUIREMENTS

## ⚠️ CRITICAL: Required Before Deployment

### 🔐 Security Setup (REQUIRED)

**Environment Variables:** Copy `.env.example` to `.env` and configure:

```bash
# Generate secure secrets (32+ characters each)
JWT_SECRET=your_super_secure_jwt_secret_here_32_chars_minimum
COOKIE_SECRET=your_super_secure_cookie_secret_here_32_chars_minimum

# Database (Production)
DATABASE_URL=postgres://user:password@your-db-host:5432/dbname?sslmode=require
DATABASE_CA_CERT=your_ca_certificate_content

# Stripe (Production Keys)
STRIPE_API_KEY=sk_live_your_live_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Supabase (Production Project)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=your-production-storage-bucket

# CORS (Your Production URLs)
STORE_CORS=https://your-domain.com
ADMIN_CORS=https://admin.your-domain.com
AUTH_CORS=https://your-domain.com
```

### 📁 Supabase Database Schema Setup

**Required Tables:**
```sql
-- User profiles and authentication
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review images and file storage
CREATE TABLE review_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social automation rules
CREATE TABLE social_automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  platforms TEXT[] DEFAULT '{}',
  triggers JSONB NOT NULL,
  template JSONB NOT NULL,
  schedule JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social posts queue
CREATE TABLE social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  customer_name TEXT,
  product_name TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Row Level Security (RLS) Policies:**
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin-only access for automation
CREATE POLICY "Admin access to social automation" ON social_automation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### 🏪 Medusa Backend Setup

**Required Configuration:**
```bash
# Start Medusa backend
cd backend
yarn install
yarn seed  # Populate with product data
yarn build
yarn start
```

**Admin Dashboard Access:**
- URL: `http://localhost:9000/admin`
- Create admin user via Medusa CLI
- Configure payment methods and shipping

### 💳 Stripe Integration

**Webhook Endpoints to Configure:**
```
https://your-domain.com/hooks/stripe
```

**Required Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`

### 🌐 Domain & SSL Setup

**Required DNS Records:**
```
A     @              your-server-ip
CNAME www            your-domain.com
CNAME api            your-domain.com
CNAME admin          your-domain.com
```

**SSL Certificate:**
- Use Let's Encrypt or CloudFlare
- Ensure HTTPS-only in production

### 🔧 Infrastructure Requirements

**Minimum Server Specs:**
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Storage:** 50GB SSD
- **Bandwidth:** 1TB/month

**Recommended Stack:**
- **Platform:** Vercel (frontend) + Railway/Heroku (backend)
- **Database:** Supabase PostgreSQL or AWS RDS
- **CDN:** CloudFlare
- **Monitoring:** Sentry for error tracking

## ⚡ Performance & Security Checklist

### 🛡️ Security Hardening
- [ ] Environment variables configured (no hardcoded secrets)
- [ ] SSL/TLS certificates installed
- [ ] Supabase RLS policies enabled
- [ ] CORS properly configured
- [ ] Content Security Policy headers set
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] File upload restrictions configured

### 🚀 Performance Optimization
- [ ] Image optimization enabled in Next.js
- [ ] CDN configured for static assets
- [ ] Database indexes created
- [ ] Caching headers configured
- [ ] Bundle size optimized
- [ ] Core Web Vitals scores >90

### 📊 Monitoring & Analytics
- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring enabled
- [ ] Google Analytics/Plausible setup
- [ ] Health check endpoints configured
- [ ] Log aggregation setup

## 🚦 Deployment Steps

### 1. Frontend Deployment (Vercel)
```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Deploy from main branch
```

### 2. Backend Deployment (Railway/Heroku)
```bash
# Create new project
# Add PostgreSQL addon
# Set environment variables
# Deploy backend container
```

### 3. Database Migration
```bash
# Run Medusa migrations
yarn migrate
# Seed with initial data
yarn seed
```

### 4. Final Testing
```bash
# Test payment flow end-to-end
# Verify email notifications
# Test admin dashboard
# Check all integrations
```

## 🆘 Support & Troubleshooting

### Common Issues:
1. **CORS Errors:** Check STORE_CORS and ADMIN_CORS values
2. **Database Connection:** Verify DATABASE_URL and SSL settings
3. **Payment Failures:** Check Stripe webhook endpoints
4. **Image Upload:** Verify Supabase bucket permissions

### Health Check URLs:
- Frontend: `https://your-domain.com/api/health`
- Backend: `https://api.your-domain.com/health`
- Admin: `https://admin.your-domain.com/health`

## 📞 Emergency Contacts
- **Technical Lead:** [Your Contact]
- **DevOps:** [Your Contact]
- **Support:** [Your Contact]

---

**⚠️ WARNING: Do NOT deploy to production until ALL items in this checklist are completed and tested.**