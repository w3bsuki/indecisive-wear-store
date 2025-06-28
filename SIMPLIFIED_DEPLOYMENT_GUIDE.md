# Production in 30 Minutes - Simplified Deployment Guide

## Overview

This guide provides a dramatically simplified deployment approach for Indecisive Wear, focusing on minimal complexity while maintaining production quality. Choose your deployment path based on your needs and budget.

## Quick Start Options

### Option 1: One-Click Railway Deploy (Recommended for MVP)
**Cost: ~$20-30/month**
**Time to Deploy: 15 minutes**

```bash
# Clone and prepare
git clone https://github.com/your-repo/indecisive-wear-store
cd indecisive-wear-store

# Deploy to Railway
railway login
railway up
```

### Option 2: Docker Compose Local/VPS
**Cost: $5-20/month (VPS)**
**Time to Deploy: 20 minutes**

```bash
# Run everything locally first
docker-compose -f docker-compose.production.yml up -d

# Deploy to any VPS with Docker
ssh your-server
git clone https://github.com/your-repo/indecisive-wear-store
cd indecisive-wear-store
docker-compose -f docker-compose.production.yml up -d
```

### Option 3: Managed Services Approach
**Cost: $0-50/month**
**Time to Deploy: 30 minutes**

- Frontend: Vercel (free tier)
- Backend: Render.com (free tier with limitations)
- Database: Supabase (free tier)
- Redis: Upstash (free tier)

## Simplified Architecture

### MVP Architecture (Minimal Cost)
```
┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render    │
│  (Frontend) │     │  (Backend)  │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │ (DB + Files)│
                    └─────────────┘
```

### Production Architecture (Recommended)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Railway   │────▶│  PostgreSQL │
│  (Frontend) │     │  (Backend)  │     │   (Railway) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Upstash   │
                    │   (Redis)   │
                    └─────────────┘
```

## Environment Variables

### Essential Variables Only
```env
# Database (get from your provider)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (get from Upstash)
REDIS_URL=redis://default:pass@host:6379

# Stripe (test keys for development)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (for file storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=product-images

# Security (generate once)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)

# URLs
STORE_CORS=https://your-store.vercel.app
ADMIN_CORS=https://your-admin.vercel.app
```

## Cost Optimization

### Free Tier Strategy ($0/month)
- **Frontend**: Vercel free tier
- **Backend**: Render.com free tier (spins down after 15 min)
- **Database**: Supabase free tier (500MB)
- **Redis**: Not needed for MVP (use in-memory)
- **Files**: Supabase storage (1GB free)

### Budget Production ($20-30/month)
- **Frontend**: Vercel free tier
- **Backend**: Railway Hobby plan ($5)
- **Database**: Railway PostgreSQL ($5)
- **Redis**: Upstash pay-as-you-go (~$5)
- **Files**: Cloudflare R2 ($0.015/GB)

### Scale Production ($50-100/month)
- **Frontend**: Vercel Pro ($20)
- **Backend**: Railway Team plan ($20)
- **Database**: Railway PostgreSQL with backups ($20)
- **Redis**: Upstash with persistence ($10)
- **CDN**: Cloudflare Pro ($20)
- **Monitoring**: Better Stack free tier

## Deployment Scripts

### 1. One-Click Deploy Script
Save as `deploy.sh`:

```bash
#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Indecisive Wear - One-Click Deploy${NC}"

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "Docker required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git required but not installed."; exit 1; }

# Select deployment target
echo -e "${YELLOW}Select deployment target:${NC}"
echo "1) Local Docker"
echo "2) Railway"
echo "3) Render"
echo "4) Custom VPS"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "Deploying locally with Docker..."
        docker-compose -f docker-compose.production.yml up -d
        echo -e "${GREEN}✅ Local deployment complete!${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:9000"
        ;;
    2)
        echo "Deploying to Railway..."
        railway login
        railway up
        echo -e "${GREEN}✅ Railway deployment initiated!${NC}"
        ;;
    3)
        echo "Deploying to Render..."
        # Add Render CLI deployment
        ;;
    4)
        read -p "Enter VPS SSH connection: " ssh_conn
        echo "Deploying to VPS..."
        ssh $ssh_conn 'bash -s' < remote-deploy.sh
        ;;
esac
```

### 2. Environment Setup Script
Save as `setup-env.sh`:

```bash
#!/bin/bash

echo "🔧 Setting up environment variables..."

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)

# Create .env files
cat > .env.local << EOF
# Generated secrets
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Add your service credentials
DATABASE_URL=
REDIS_URL=
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=

# URLs (update these)
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000
EOF

echo "✅ Environment file created at .env.local"
echo "📝 Please fill in your service credentials"
```

### 3. Health Check Script
Save as `health-check.sh`:

```bash
#!/bin/bash

echo "🏥 Running health checks..."

# Check frontend
curl -f http://localhost:3000 || echo "❌ Frontend not responding"

# Check backend
curl -f http://localhost:9000/health || echo "❌ Backend not responding"

# Check database
docker exec postgres pg_isready || echo "❌ Database not ready"

# Check Redis
docker exec redis redis-cli ping || echo "❌ Redis not responding"

echo "✅ Health check complete"
```

## Docker Compose Production

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://backend:9000
    depends_on:
      - backend

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "9000:9000"
    env_file:
      - .env.local
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Database
  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=medusa
      - POSTGRES_USER=medusa
      - POSTGRES_PASSWORD=${DB_PASSWORD:-secure_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medusa"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          
      - name: Deploy Backend to Railway
        uses: berviantoleo/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

## Monitoring Setup

### Free Monitoring Stack
1. **Uptime**: Better Stack (free tier)
2. **Logs**: Logtail (free tier)
3. **Analytics**: Vercel Analytics (free)
4. **Error Tracking**: Sentry (free tier)

### Essential Metrics Only
```javascript
// Add to backend/src/api/monitoring/route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const metrics = {
    health: "ok",
    timestamp: new Date().toISOString(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json(metrics);
}
```

## Progressive Deployment Strategy

### Phase 1: MVP Launch (Week 1)
- Deploy frontend to Vercel
- Deploy backend to Render free tier
- Use Supabase for database and files
- No Redis (use in-memory cache)

### Phase 2: Performance Optimization (Week 2-4)
- Add Upstash Redis
- Enable CDN for static assets
- Implement basic caching

### Phase 3: Scale Preparation (Month 2)
- Migrate to Railway or dedicated VPS
- Add monitoring and alerts
- Implement backup strategy

## Quick Commands Reference

```bash
# Local development
docker-compose up -d
pnpm dev              # Frontend
cd backend && yarn dev # Backend

# Production deployment
./deploy.sh           # Run deployment script
./health-check.sh     # Check system health

# Database operations
docker exec postgres pg_dump medusa > backup.sql
docker exec postgres psql -U medusa < backup.sql

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend
docker-compose restart frontend
```

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Failed**
   ```bash
   # Check if database is running
   docker ps | grep postgres
   # Check connection string
   echo $DATABASE_URL
   ```

2. **Redis Connection Failed**
   ```bash
   # For MVP, disable Redis in backend
   # Set REDIS_URL="" in environment
   ```

3. **Frontend Can't Connect to Backend**
   ```bash
   # Check CORS settings
   # Ensure STORE_CORS matches frontend URL
   ```

4. **Out of Memory**
   ```bash
   # Add swap space on VPS
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

## Next Steps

1. Run `./setup-env.sh` to generate environment files
2. Choose your deployment option (Railway recommended for simplicity)
3. Run `./deploy.sh` and follow the prompts
4. Set up monitoring with Better Stack free tier
5. Configure backups (daily database dumps)

## Support

- Documentation: [/docs](./docs)
- Issues: GitHub Issues
- Community: Discord Server

---

Remember: Start simple, scale when needed. You don't need everything on day one!