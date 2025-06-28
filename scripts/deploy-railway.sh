#!/bin/bash

# Railway Deployment Script for Indecisive Wear
# This script handles the complete deployment process

set -e  # Exit on error

echo "🚂 Railway Deployment for Indecisive Wear"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisite() {
    command -v $1 >/dev/null 2>&1 || {
        echo -e "${RED}❌ $1 is required but not installed.${NC}"
        if [ "$1" = "railway" ]; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        else
            echo "Please install $1 and try again."
            exit 1
        fi
    }
}

echo "🔍 Checking prerequisites..."
check_prerequisite "node"
check_prerequisite "yarn"
check_prerequisite "railway"
check_prerequisite "jq"

# Apply critical fixes
echo -e "${YELLOW}📝 Applying critical fixes...${NC}"

# Fix package.json
cd backend
if ! grep -q "@swc/core" package.json; then
    echo "Adding SWC override to package.json..."
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.overrides = pkg.overrides || {};
    pkg.overrides['@swc/core'] = '1.3.96';
    pkg.overrides['@swc/helpers'] = '0.5.2';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

# Create database config if missing
if [ ! -f "src/utils/database-config.ts" ]; then
    echo "Creating database configuration..."
    mkdir -p src/utils
    cat > src/utils/database-config.ts << 'EOF'
export const getDatabaseConfig = () => {
  const url = new URL(process.env.DATABASE_URL!);
  
  return {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    acquireConnectionTimeout: 60000,
  };
};
EOF
fi

# Create health check endpoint
if [ ! -f "src/api/health/route.ts" ]; then
    echo "Creating health check endpoint..."
    mkdir -p src/api/health
    cat > src/api/health/route.ts << 'EOF'
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {} as Record<string, any>
  };

  // Database check
  try {
    const knex = req.scope.resolve("knex");
    await knex.raw('SELECT 1');
    checks.checks.database = { status: 'healthy' };
  } catch (error: any) {
    checks.status = 'unhealthy';
    checks.checks.database = { 
      status: 'unhealthy', 
      error: error.message 
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
};
EOF
fi

cd ..

# Login to Railway
echo -e "${YELLOW}🔐 Logging into Railway...${NC}"
railway login

# Create or link project
if [ ! -f ".railway/config.json" ]; then
    echo "Creating new Railway project..."
    railway init
else
    echo "Using existing Railway project"
fi

# Generate secrets if not exists
if [ ! -f "backend/.env.production" ]; then
    echo -e "${YELLOW}🔐 Generating production secrets...${NC}"
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 32)
    
    cat > backend/.env.production << EOF
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET
PORT=9000
EOF
    echo -e "${GREEN}✅ Secrets generated${NC}"
fi

# Add services
echo -e "${YELLOW}📦 Setting up Railway services...${NC}"

# PostgreSQL
echo "Adding PostgreSQL..."
railway add postgresql 2>/dev/null || echo "PostgreSQL already exists"

# Redis
echo "Adding Redis..."
railway add redis 2>/dev/null || echo "Redis already exists"

# Set environment variables
echo -e "${YELLOW}🔧 Setting environment variables...${NC}"

# Read secrets from .env.production
source backend/.env.production

# Core variables
railway variables set NODE_ENV=production
railway variables set PORT=9000
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set COOKIE_SECRET=$COOKIE_SECRET

# CORS settings
read -p "Enter your frontend URL (e.g., https://yourdomain.com): " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}

railway variables set STORE_CORS=$FRONTEND_URL
railway variables set AUTH_CORS=\${{RAILWAY_STATIC_URL}}
railway variables set ADMIN_CORS=\${{RAILWAY_STATIC_URL}}

# Stripe settings
read -p "Enter your Stripe API key (sk_live_xxx): " STRIPE_API_KEY
if [ ! -z "$STRIPE_API_KEY" ]; then
    railway variables set STRIPE_API_KEY=$STRIPE_API_KEY
fi

read -p "Enter your Stripe webhook secret (whsec_xxx): " STRIPE_WEBHOOK_SECRET
if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    railway variables set STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
fi

# Supabase settings
read -p "Enter your Supabase URL: " SUPABASE_URL
if [ ! -z "$SUPABASE_URL" ]; then
    railway variables set SUPABASE_URL=$SUPABASE_URL
fi

read -p "Enter your Supabase service role key: " SUPABASE_SERVICE_ROLE_KEY
if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    railway variables set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
fi

# Database and Redis URLs (Railway provides these)
railway variables set DATABASE_URL=\${{DATABASE_URL}}
railway variables set REDIS_URL=\${{REDIS_URL}}?family=0

# Deploy main service
echo -e "${YELLOW}🚀 Deploying backend service...${NC}"
railway up

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 30

# Get service URL
SERVICE_URL=$(railway status --json 2>/dev/null | jq -r '.url' || echo "")

if [ -z "$SERVICE_URL" ]; then
    echo -e "${YELLOW}Generating public URL...${NC}"
    railway domain
    sleep 10
    SERVICE_URL=$(railway status --json 2>/dev/null | jq -r '.url' || echo "")
fi

# Create worker service
echo -e "${YELLOW}👷 Setting up worker service...${NC}"
read -p "Deploy worker service? (recommended for production) [y/N]: " DEPLOY_WORKER

if [[ $DEPLOY_WORKER =~ ^[Yy]$ ]]; then
    # Save current service
    MAIN_SERVICE=$(railway status --json | jq -r '.id')
    
    # Create worker service
    railway service create medusa-worker || echo "Worker service exists"
    
    # Link to worker service
    railway link medusa-worker
    
    # Copy environment variables
    railway variables set NODE_ENV=production
    railway variables set MEDUSA_WORKER_MODE=worker
    railway variables set DISABLE_MEDUSA_ADMIN=true
    railway variables set DATABASE_URL=\${{DATABASE_URL}}
    railway variables set REDIS_URL=\${{REDIS_URL}}?family=0
    railway variables set JWT_SECRET=$JWT_SECRET
    railway variables set COOKIE_SECRET=$COOKIE_SECRET
    
    # Deploy worker
    railway up
    
    # Switch back to main service
    railway link $MAIN_SERVICE
fi

# Final checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

if [ ! -z "$SERVICE_URL" ]; then
    # Update webhook URL
    railway variables set STRIPE_WEBHOOK_ENDPOINT_URL=https://$SERVICE_URL/api/hooks/payment/stripe
    
    sleep 10
    
    # Check health
    HEALTH_RESPONSE=$(curl -s https://$SERVICE_URL/health || echo "{}")
    HEALTH_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status' || echo "unknown")
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo -e "${GREEN}✅ Backend is healthy!${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check failed. This might be normal during initial deployment.${NC}"
        echo "Response: $HEALTH_RESPONSE"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "=================================="
    echo "Backend URL: https://$SERVICE_URL"
    echo "Admin Panel: https://$SERVICE_URL/admin"
    echo "Health Check: https://$SERVICE_URL/health"
    echo ""
    echo "Next steps:"
    echo "1. Update your frontend .env with NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://$SERVICE_URL"
    echo "2. Add Stripe webhook endpoint: https://$SERVICE_URL/api/hooks/payment/stripe"
    echo "3. Run migrations: railway run yarn medusa db:migrate"
    echo "4. Create admin user: railway run yarn medusa user:create"
else
    echo -e "${RED}❌ Could not get service URL. Check Railway dashboard.${NC}"
fi

echo ""
echo "📝 View logs: railway logs --tail"
echo "🔧 Open dashboard: railway open"