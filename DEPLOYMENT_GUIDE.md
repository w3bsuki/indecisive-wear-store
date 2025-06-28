# Production Deployment Guide

This guide covers deploying the Indecisive Wear Store to Railway or Render with Stripe integration.

## Railway Deployment

### 1. Backend Deployment (Medusa)

#### railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "cd backend && yarn install && yarn build"

[deploy]
startCommand = "cd backend && yarn start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10

[[services]]
name = "medusa-backend"
type = "web"

[services.medusa-backend]
port = 9000
```

#### Environment Variables (Railway)
```bash
# Add these in Railway dashboard
NODE_ENV=production
PORT=9000

# Database (Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
COOKIE_SECRET=<generate-with-openssl-rand-base64-32>

# Stripe
STRIPE_API_KEY=sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# CORS
STORE_CORS=https://your-frontend.railway.app
ADMIN_CORS=https://your-backend.railway.app
AUTH_CORS=https://your-frontend.railway.app,https://your-backend.railway.app

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-key
SUPABASE_BUCKET=your-bucket
```

### 2. Frontend Deployment (Next.js)

#### railway.toml (Frontend)
```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/"
healthcheckTimeout = 300

[[services]]
name = "nextjs-frontend"
type = "web"

[services.nextjs-frontend]
port = 3000
```

#### Environment Variables (Frontend - Railway)
```bash
NODE_ENV=production
NEXT_PUBLIC_STRIPE_KEY=pk_live_YOUR_KEY
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.railway.app
```

## Render Deployment

### 1. Backend Deployment (Medusa)

#### render.yaml
```yaml
services:
  # PostgreSQL Database
  - type: postgres
    name: medusa-db
    plan: standard
    ipAllowList: []

  # Redis
  - type: redis
    name: medusa-redis
    plan: standard
    ipAllowList: []

  # Medusa Backend
  - type: web
    name: medusa-backend
    runtime: node
    plan: standard
    buildCommand: cd backend && yarn install && yarn build
    startCommand: cd backend && yarn start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 9000
      - key: DATABASE_URL
        fromDatabase:
          name: medusa-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: medusa-redis
          type: redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: COOKIE_SECRET
        generateValue: true
      - key: STRIPE_API_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: STORE_CORS
        value: https://your-frontend.onrender.com
      - key: ADMIN_CORS
        value: https://your-backend.onrender.com
      - key: AUTH_CORS
        value: https://your-frontend.onrender.com,https://your-backend.onrender.com

  # Next.js Frontend
  - type: web
    name: nextjs-frontend
    runtime: node
    plan: standard
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_STRIPE_KEY
        value: pk_live_YOUR_KEY
      - key: NEXT_PUBLIC_MEDUSA_BACKEND_URL
        value: https://your-backend.onrender.com
```

## Post-Deployment Steps

### 1. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint URL:
   - Railway: `https://your-backend.railway.app/hooks/payment/stripe`
   - Render: `https://your-backend.onrender.com/hooks/payment/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.succeeded`
   - `charge.failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `checkout.session.completed`
4. Copy the signing secret and update `STRIPE_WEBHOOK_SECRET`

### 2. Configure Domain & SSL

#### Railway:
```bash
# Add custom domain in Railway dashboard
# Railway automatically provisions SSL certificates
```

#### Render:
```bash
# Add custom domain in Render dashboard
# Render automatically provisions SSL certificates
```

### 3. Enable Stripe in Medusa Admin

1. Access admin panel: `https://your-backend.railway.app/admin`
2. Go to Settings → Regions
3. Edit each region and add "Stripe" as payment provider
4. Configure currency and payment settings

### 4. Database Migrations

```bash
# SSH into your deployment or use web console
cd backend
npx medusa migrations run
```

### 5. Seed Initial Data (Optional)

```bash
# Only if you want demo data
cd backend
yarn seed
```

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Database has SSL enabled
- [ ] CORS is properly configured
- [ ] JWT and Cookie secrets are strong and unique
- [ ] Stripe webhook secret is configured
- [ ] HTTPS is enforced on all endpoints
- [ ] Rate limiting is enabled
- [ ] Error monitoring is set up

## Monitoring Setup

### 1. Health Checks

Both platforms support health checks. The backend exposes `/health` endpoint.

### 2. Logging

#### Railway:
```javascript
// Logs are automatically collected
console.log() // Standard output
console.error() // Error output
```

#### Render:
```javascript
// Similar to Railway, logs are collected automatically
```

### 3. Error Tracking (Optional)

Add Sentry for error tracking:

```bash
# Backend
SENTRY_DSN=your-sentry-dsn

# Frontend
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Performance Optimization

### 1. Enable Caching

```javascript
// In medusa-config.ts
const config = {
  projectConfig: {
    redis_url: process.env.REDIS_URL,
    database_extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
}
```

### 2. CDN for Static Assets

- Railway: Use Cloudflare or similar CDN
- Render: Built-in CDN for static assets

### 3. Database Indexes

```sql
-- Add indexes for common queries
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_cart_customer_id ON carts(customer_id);
```

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Fails**
   - Ensure raw body is used for verification
   - Check webhook secret is correct
   - Verify endpoint URL matches Stripe configuration

2. **CORS Errors**
   - Update STORE_CORS and AUTH_CORS environment variables
   - Ensure frontend URL is whitelisted

3. **Database Connection Issues**
   - Check DATABASE_URL includes `?sslmode=require`
   - Verify database is accessible from deployment

4. **Payment Processing Fails**
   - Verify Stripe API keys are production keys
   - Check payment provider is enabled in region settings
   - Review Stripe dashboard for detailed errors

### Debug Commands

```bash
# Check application logs
railway logs

# or for Render
render logs

# Test webhook locally
stripe listen --forward-to localhost:9000/hooks/payment/stripe

# Test database connection
cd backend && npx medusa db:ping
```

## Scaling Considerations

### Railway:
- Horizontal scaling: Add more instances
- Vertical scaling: Upgrade to higher tier
- Auto-scaling: Available on Pro plan

### Render:
- Similar scaling options
- Auto-scaling available
- Regional deployments supported

## Cost Optimization

1. Use managed Redis for session storage
2. Enable query caching
3. Optimize image sizes with Supabase transformations
4. Use CDN for static assets
5. Monitor and optimize database queries

## Backup Strategy

1. **Database Backups**
   - Railway: Automated daily backups
   - Render: Automated backups on paid plans

2. **Code Backups**
   - Use Git tags for releases
   - Maintain staging environment

3. **Configuration Backups**
   - Export environment variables
   - Document all custom configurations