# Render Deployment Plan for Medusa 2.0 + Stripe + Supabase

## Why Render?
- Free PostgreSQL tier available
- Blueprint deployment support
- Automatic HTTPS
- Better logging interface
- Predictable pricing

## Step 1: Prepare for Render

### 1.1 Create render.yaml
```yaml
services:
  # Medusa API Service
  - type: web
    name: medusa-api
    runtime: node
    repo: https://github.com/YOUR_USERNAME/indecisive-wear-store
    buildCommand: cd backend && yarn install && yarn build
    startCommand: cd backend && yarn predeploy && yarn start
    rootDir: .
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
      - key: ADMIN_CORS
        fromService:
          type: web
          name: medusa-api
          property: host
      - key: STORE_CORS
        value: https://your-frontend.vercel.app
    healthCheckPath: /health
    autoDeploy: false

  # Worker Service
  - type: worker
    name: medusa-worker
    runtime: node
    repo: https://github.com/YOUR_USERNAME/indecisive-wear-store
    buildCommand: cd backend && yarn install && yarn build
    startCommand: cd backend && yarn worker
    rootDir: .
    envVars:
      - key: MEDUSA_WORKER_MODE
        value: worker
      - key: DISABLE_MEDUSA_ADMIN
        value: true
      - key: DATABASE_URL
        fromDatabase:
          name: medusa-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: medusa-redis
          type: redis
          property: connectionString

databases:
  - name: medusa-db
    plan: free # or standard for production
    databaseName: medusa
    user: medusa

services:
  - type: redis
    name: medusa-redis
    plan: free # or standard for production
    maxmemoryPolicy: allkeys-lru
```

### 1.2 Create render-build.sh
```bash
#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
cd backend
yarn install --frozen-lockfile

echo "Building Medusa..."
yarn build

echo "Build complete!"
```

### 1.3 Update package.json
```json
{
  "engines": {
    "node": ">=18.0.0",
    "yarn": ">=1.22.0"
  }
}
```

## Step 2: Deploy to Render

### 2.1 Via Dashboard
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect GitHub repository
4. Select your repo
5. Use the render.yaml file
6. Click "Apply"

### 2.2 Via CLI
```bash
# Install Render CLI
brew tap render-oss/render
brew install render

# Deploy
render blueprint launch
```

## Step 3: Configure Services

### 3.1 Environment Variables
```bash
# Medusa Core
NODE_ENV=production
MEDUSA_ADMIN_ONBOARDING_TYPE=default

# URLs (Render provides these)
RENDER_EXTERNAL_URL=https://medusa-api.onrender.com
ADMIN_CORS=https://medusa-api.onrender.com
STORE_CORS=https://your-frontend.vercel.app
AUTH_CORS=https://medusa-api.onrender.com

# Stripe
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_ENDPOINT_URL=https://medusa-api.onrender.com/api/hooks/payment/stripe

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_BUCKET=product-images

# Performance
NODE_OPTIONS=--max-old-space-size=2048
```

### 3.2 Custom Domain
1. Go to Settings → Custom Domain
2. Add your domain
3. Render handles SSL automatically

### 3.3 Static Files
```yaml
# Add to render.yaml for static files
staticSites:
  - type: web
    name: medusa-static
    buildCommand: cd backend && yarn build:admin
    staticPublishPath: ./backend/.medusa/admin
    routes:
      - type: rewrite
        source: /admin/*
        destination: /*
```

## Step 4: Database Setup

### 4.1 Free Tier Limitations
- 1GB storage
- 97 days retention
- Shared CPU

### 4.2 Production Database
```yaml
databases:
  - name: medusa-db
    plan: standard
    databaseName: medusa
    user: medusa
    postgresMajorVersion: 15
```

### 4.3 Connection Pooling
```typescript
// backend/datasource.js
module.exports = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  extra: {
    ssl: {
      rejectUnauthorized: false
    },
    max: 20, // connection pool size
    idleTimeoutMillis: 30000
  }
}
```

## Step 5: Redis Alternative (If Free Tier Needed)

Since Render's Redis requires paid plan, use Upstash:

### 5.1 Setup Upstash
1. Create account at https://upstash.com
2. Create Redis database
3. Get connection string

### 5.2 Configure Medusa
```javascript
// medusa-config.js
module.exports = {
  projectConfig: {
    redis_url: process.env.UPSTASH_REDIS_URL,
    redis_options: {
      tls: true,
      family: 4
    }
  }
}
```

## Step 6: Monitoring & Health

### 6.1 Health Check Endpoint
```typescript
// backend/src/api/health/route.ts
export async function GET() {
  const checks = {
    server: "ok",
    database: await checkDatabase(),
    redis: await checkRedis(),
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(checks), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}
```

### 6.2 Render Monitoring
- Built-in metrics dashboard
- Log streaming
- Alert policies
- Automatic restarts

## Step 7: CI/CD Pipeline

### 7.1 GitHub Actions
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys
```

## Post-Deployment Verification

```bash
# Check API
curl https://medusa-api.onrender.com/store/products

# Check Admin
open https://medusa-api.onrender.com/admin

# Check Health
curl https://medusa-api.onrender.com/health

# View Logs
render logs medusa-api --tail
```

## Troubleshooting Render

### Slow Cold Starts
Free tier services sleep after 15 minutes. Solutions:
1. Upgrade to paid tier
2. Use external pinger service
3. Implement warm-up script

### Database Connection Drops
```javascript
// Add retry logic
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  statement_timeout: 10000
})
```

### Build Timeouts
```yaml
# Increase build timeout
services:
  - type: web
    buildCommand: cd backend && yarn install --network-timeout 600000 && yarn build
```

## Cost Comparison

### Render
- Free: Limited (sleeps, shared resources)
- Starter: $7/month per service
- Standard: $25/month (2GB RAM)
- PostgreSQL: $7/month (starter)
- Redis: $10/month

### Railway
- Hobby: $5/month + usage
- Pro: $20/month + usage
- Usage-based pricing
- No sleep on hobby plan

## Recommendation
For production with budget constraints: Use Render with external Redis (Upstash)
For simplicity and better performance: Use Railway with integrated services