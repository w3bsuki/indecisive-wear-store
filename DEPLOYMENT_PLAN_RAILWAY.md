# Railway Deployment Plan for Medusa 2.0 + Stripe + Supabase

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Railway       │     │   Supabase      │
│   (Frontend)    │────▶│   (Backend)     │────▶│   (Social DB)   │
│   Next.js App   │     │   Medusa API    │     │   Auth + Files  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     Stripe      │
                        │   (Payments)    │
                        └─────────────────┘
```

## Step 1: Prepare Medusa for Production

### 1.1 Update backend/package.json
```json
{
  "scripts": {
    "build": "medusa build",
    "start": "medusa start",
    "worker": "medusa start --worker-mode",
    "predeploy": "medusa db:migrate"
  },
  "overrides": {
    "@swc/core": "1.11.21"
  }
}
```

### 1.2 Create railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && yarn install && yarn build"
  },
  "deploy": {
    "startCommand": "cd backend && yarn predeploy && yarn start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

### 1.3 Create .nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "yarn", "postgresql"]

[phases.install]
cmds = ["cd backend && yarn install --frozen-lockfile"]

[phases.build]
cmds = ["cd backend && yarn build"]

[start]
cmd = "cd backend && yarn predeploy && yarn start"
```

## Step 2: Railway Setup

### 2.1 Create New Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init
```

### 2.2 Add Services via Dashboard

1. **PostgreSQL Database**
   - Click "Add Service" → PostgreSQL
   - Note the DATABASE_URL

2. **Redis Instance**
   - Click "Add Service" → Redis
   - Note the REDIS_URL

### 2.3 Environment Variables

```bash
# Core Medusa
NODE_ENV=production
MEDUSA_WORKER_MODE=server
MEDUSA_ADMIN_ONBOARDING_TYPE=default
ADMIN_CORS=https://${{RAILWAY_STATIC_URL}}
STORE_CORS=https://your-frontend.vercel.app
AUTH_CORS=https://${{RAILWAY_STATIC_URL}}

# Security (Generate these!)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)

# Database
DATABASE_URL=${{DATABASE_URL}}
DATABASE_TYPE=postgres
DATABASE_EXTRA='{"ssl":{"rejectUnauthorized":false}}'

# Redis
REDIS_URL=${{REDIS_URL}}?family=0

# Stripe
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_ENDPOINT_URL=https://${{RAILWAY_STATIC_URL}}/api/hooks/payment/stripe

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=product-images

# Railway Specific
PORT=9000
RAILWAY_STATIC_URL=${{RAILWAY_STATIC_URL}}
```

### 2.4 Deploy Commands

```bash
# Deploy main service
railway up

# Create worker service (separate)
railway service create medusa-worker
railway link medusa-worker
railway variables set MEDUSA_WORKER_MODE=worker DISABLE_MEDUSA_ADMIN=true
railway up
```

## Step 3: Configure Networking

### 3.1 Domain Setup
1. Go to Settings → Networking
2. Generate domain or add custom domain
3. Enable HTTPS (automatic)

### 3.2 Health Checks
```typescript
// backend/src/api/health/route.ts
export const GET = async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    redis: await checkRedis(),
    database: await checkDatabase(),
  }
  res.json(health)
}
```

## Step 4: Frontend Integration

### 4.1 Update Frontend Environment
```bash
# .env.production
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-app.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4.2 Update API Client
```typescript
// lib/medusa-client.ts
import Medusa from "@medusajs/medusa-js"

export const medusaClient = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  maxRetries: 3,
  apiKey: process.env.MEDUSA_API_KEY, // Optional for public routes
})
```

## Step 5: Monitoring & Scaling

### 5.1 Enable Monitoring
```yaml
# railway.yaml
services:
  web:
    healthcheck:
      path: /health
      interval: 30s
    scaling:
      minInstances: 1
      maxInstances: 3
      targetCPU: 70
```

### 5.2 Add Logging
```typescript
// backend/src/utils/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    // Add Datadog, LogDNA, etc.
  ]
})
```

## Post-Deployment Checklist

- [ ] Admin panel accessible at https://your-app.railway.app/admin
- [ ] API responds at https://your-app.railway.app/store/products
- [ ] Database migrations completed
- [ ] Redis connection verified
- [ ] Stripe webhooks receiving events
- [ ] Supabase auth working
- [ ] File uploads functional
- [ ] Worker processing jobs
- [ ] SSL certificate active
- [ ] CORS properly configured
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Backups configured

## Troubleshooting

### White Screen Admin
```bash
# Check SWC version
cd backend && grep "@swc/core" yarn.lock

# Rebuild admin
yarn build:admin
```

### Worker Not Processing
```bash
# Check Redis URL format
echo $REDIS_URL  # Must end with ?family=0

# Verify worker mode
echo $MEDUSA_WORKER_MODE  # Should be "worker"
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check SSL requirement
DATABASE_EXTRA='{"ssl":{"rejectUnauthorized":false}}'
```

## Cost Estimate
- Starter: ~$5/month (1 service + DB)
- Production: ~$20/month (2 services + DB + Redis)
- Scale: ~$50+/month (multiple instances + monitoring)