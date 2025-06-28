# 🚀 Simplified Production Deployment (V2)

## 🎯 Quick Decision Guide

Choose your deployment strategy based on budget and needs:

| Strategy | Cost | Setup Time | Best For |
|----------|------|------------|----------|
| **Free Tier** | $0/mo | 30 min | Testing, MVP validation |
| **Budget Production** | $20/mo | 45 min | Small business, <1000 orders/mo |
| **Scalable Production** | $50+/mo | 1 hour | Growing business, >1000 orders/mo |

## 📋 Pre-Flight Checklist

Before ANY deployment, complete these critical fixes:

```bash
# 1. Apply all fixes from CRITICAL_FIXES_REQUIRED.md
# 2. Generate secure secrets
cd backend
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "COOKIE_SECRET=$(openssl rand -hex 32)" >> .env

# 3. Test locally
docker-compose -f docker-compose.test.yml up
curl http://localhost:9000/health
```

## 🆓 Option 1: Free Tier Deployment ($0/month)

Perfect for testing and MVP validation.

### Architecture:
```
Frontend (Vercel Free) → Backend (Render Free) → DB (Supabase Free)
                     ↘                        ↗
                       Stripe (Pay as you go)
```

### Step-by-Step:

#### 1. Supabase Setup (5 min)
```bash
# Create project at supabase.com
# Get your project URL and anon key
# Enable authentication
```

#### 2. Backend on Render (10 min)
```yaml
# render.yaml
services:
  - type: web
    name: medusa-backend
    plan: free
    buildCommand: cd backend && yarn install && yarn build
    startCommand: cd backend && yarn start
    envVars:
      - key: DATABASE_URL
        value: # Get from Supabase SQL Editor
      - key: REDIS_URL
        value: # Use Upstash Redis (free tier)
```

#### 3. Frontend on Vercel (5 min)
```bash
vercel deploy
# Add environment variables in dashboard
```

### Limitations:
- Backend sleeps after 15 min inactivity
- Limited to 512MB RAM
- No background workers

## 💰 Option 2: Budget Production ($20/month)

Best balance of cost and performance.

### Architecture:
```
Frontend (Vercel) → Backend (Railway) → PostgreSQL (Railway)
                 ↘                   ↗     +
                   Stripe + Supabase    Redis (Railway)
```

### One-Command Deploy:

```bash
# Clone and run our deployment script
git clone https://github.com/yourusername/indecisive-wear-store.git
cd indecisive-wear-store
./scripts/deploy-railway.sh
```

### Manual Steps:

#### 1. Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add services
railway add postgresql
railway add redis

# Deploy
railway up
```

#### 2. Environment Variables
```bash
# Use our script to generate and set all vars
./scripts/setup-env.sh railway

# Or manually set in Railway dashboard
```

#### 3. Deploy Worker
```bash
# Create separate service for worker
railway service create medusa-worker
railway link medusa-worker
railway variables set MEDUSA_WORKER_MODE=worker
railway up
```

## ⚡ Option 3: Quick Local Docker ($0/month)

For development and testing.

```bash
# One command to rule them all
docker-compose -f docker-compose.production.yml up -d

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:9000
# Admin: http://localhost:9000/admin
```

## 🛠️ Automated Deployment Scripts

### 1. Universal Deploy Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Indecisive Wear Deployment Script"
echo "===================================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo "❌ Yarn is required"; exit 1; }

# Select deployment target
echo "Select deployment target:"
echo "1) Local Docker"
echo "2) Railway (Recommended)"
echo "3) Render"
echo "4) Custom VPS"
read -p "Enter choice [1-4]: " choice

case $choice in
  1)
    echo "🐳 Deploying to Docker..."
    docker-compose -f docker-compose.production.yml up -d
    echo "✅ Deployed to http://localhost:9000"
    ;;
  2)
    echo "🚂 Deploying to Railway..."
    ./scripts/deploy-railway.sh
    ;;
  3)
    echo "🎨 Deploying to Render..."
    ./scripts/deploy-render.sh
    ;;
  4)
    echo "🖥️ Deploying to VPS..."
    ./scripts/deploy-vps.sh
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
```

### 2. Railway Deploy Script

Create `scripts/deploy-railway.sh`:

```bash
#!/bin/bash

echo "🚂 Railway Deployment"

# Check Railway CLI
command -v railway >/dev/null 2>&1 || {
  echo "Installing Railway CLI..."
  npm install -g @railway/cli
}

# Login
railway login

# Create project if needed
if [ ! -f ".railway/config.json" ]; then
  railway init
fi

# Apply critical fixes
echo "📝 Applying critical fixes..."
cp backend/package.json backend/package.json.backup
node -e "
const pkg = require('./backend/package.json');
pkg.overrides = {'@swc/core': '1.3.96'};
require('fs').writeFileSync('./backend/package.json', JSON.stringify(pkg, null, 2));
"

# Generate secrets
if [ ! -f "backend/.env.production" ]; then
  echo "🔐 Generating secrets..."
  cat > backend/.env.production << EOF
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF
fi

# Add services
echo "📦 Adding services..."
railway add postgresql || true
railway add redis || true

# Set variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=9000
railway variables set MEDUSA_WORKER_MODE=server

# Deploy
echo "🚀 Deploying..."
railway up

# Get URL
URL=$(railway status --json | jq -r '.url')
echo "✅ Deployed to: $URL"
echo "📝 Admin panel: $URL/admin"

# Create worker
echo "👷 Creating worker service..."
railway service create medusa-worker
railway link medusa-worker
railway variables set MEDUSA_WORKER_MODE=worker DISABLE_MEDUSA_ADMIN=true
railway up

echo "✅ Deployment complete!"
```

### 3. Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

BACKEND_URL=${1:-"http://localhost:9000"}

echo "🏥 Health Check for $BACKEND_URL"
echo "================================"

# Check API health
response=$(curl -s "$BACKEND_URL/health")
status=$(echo $response | jq -r '.status')

if [ "$status" = "healthy" ]; then
  echo "✅ API Status: Healthy"
else
  echo "❌ API Status: Unhealthy"
  echo $response | jq
fi

# Check admin panel
admin_status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/admin")
if [ "$admin_status" = "200" ]; then
  echo "✅ Admin Panel: Accessible"
else
  echo "❌ Admin Panel: Not accessible (HTTP $admin_status)"
fi

# Check database
db_status=$(echo $response | jq -r '.checks.database.status')
if [ "$db_status" = "healthy" ]; then
  echo "✅ Database: Connected"
else
  echo "❌ Database: Not connected"
fi

# Check Redis
redis_status=$(echo $response | jq -r '.checks.redis.status')
if [ "$redis_status" = "healthy" ]; then
  echo "✅ Redis: Connected"
else
  echo "⚠️  Redis: Not connected (background jobs won't work)"
fi

# Memory usage
memory=$(echo $response | jq -r '.checks.memory.heapUsed')
echo "💾 Memory Usage: $memory"
```

## 🔧 Post-Deployment Setup

### 1. Configure Stripe
```bash
# Add webhook endpoint in Stripe Dashboard
https://your-backend-url.railway.app/api/hooks/payment/stripe

# Add webhook secret to environment
railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 2. Configure Supabase
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS customer_sync (
  medusa_id VARCHAR PRIMARY KEY,
  supabase_id UUID REFERENCES auth.users(id),
  synced_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Test Everything
```bash
# Run our test script
./scripts/test-deployment.sh https://your-backend-url.railway.app
```

## 📊 Cost Optimization Tips

1. **Start with Railway Hobby ($5/month)**
   - Includes $5 of usage
   - Usually covers basic backend + database

2. **Use Supabase for Storage**
   - Free tier includes 1GB storage
   - Cheaper than S3 for small scale

3. **CDN for Static Assets**
   - Use Vercel's built-in CDN
   - Or Cloudflare (free tier)

4. **Monitor Usage**
   ```bash
   railway usage
   ```

## 🚨 Common Issues & Quick Fixes

### Admin Panel White Screen
```bash
# Quick fix
cd backend
rm -rf node_modules .medusa/admin
yarn install
yarn build:admin
railway up
```

### Redis Connection Failed
```bash
# Ensure ?family=0 is added
railway variables set REDIS_URL="${REDIS_URL}?family=0"
```

### Database Pool Exhausted
```bash
# Restart the service
railway restart
```

## 🎯 Next Steps

1. **Test Payment Flow**
   - Use Stripe test card: 4242 4242 4242 4242
   - Verify webhook receives events

2. **Set Up Monitoring**
   - Add UptimeRobot (free)
   - Enable Railway metrics

3. **Configure Backups**
   - Railway automatic backups
   - Or use our backup script

## 📞 Need Help?

- Check logs: `railway logs --tail`
- Run health check: `./scripts/health-check.sh`
- Review CRITICAL_FIXES_REQUIRED.md

Remember: **Apply all critical fixes before deploying!**