#!/bin/bash

# Quick Deploy Script - Get running in under 5 minutes
# This script provides the absolute fastest way to deploy

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   INDECISIVE WEAR - 5 MINUTE DEPLOY       ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is required but not installed${NC}"
        exit 1
    fi
}

# Check minimal requirements
echo -e "${YELLOW}Checking requirements...${NC}"
check_command git
check_command node
check_command npm
echo -e "${GREEN}✓ All requirements met${NC}\n"

# Quick environment setup
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Setting up environment...${NC}"
    cp .env.local.example .env.production 2>/dev/null || cat > .env.production << EOF
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa
REDIS_URL=
STRIPE_API_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000
NODE_ENV=production
EOF
    echo -e "${GREEN}✓ Environment created${NC}\n"
fi

# Select ultra-fast deployment
echo -e "${BLUE}Select deployment method:${NC}"
echo "1) Vercel + Supabase (Fastest - 3 minutes)"
echo "2) Railway (One-click - 5 minutes)"
echo "3) Local Docker (Testing - 2 minutes)"
read -p "Choice (1-3): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Deploying to Vercel + Supabase...${NC}"
        
        # Install Vercel CLI if needed
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm i -g vercel
        fi
        
        # Frontend deployment
        echo -e "\n${BLUE}Step 1: Deploy Frontend${NC}"
        vercel --yes
        
        echo -e "\n${BLUE}Step 2: Set up Supabase${NC}"
        echo "1. Go to https://supabase.com/dashboard"
        echo "2. Create new project (takes ~2 minutes)"
        echo "3. Copy the connection string"
        
        read -p "Press Enter when Supabase is ready..."
        read -p "Enter Supabase database URL: " db_url
        
        # Update environment
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$db_url|" .env.production
        
        echo -e "\n${BLUE}Step 3: Deploy Backend${NC}"
        cd backend
        vercel --yes --env-file ../.env.production
        cd ..
        
        echo -e "\n${GREEN}✅ Deployment complete!${NC}"
        echo "Frontend: Check Vercel dashboard"
        echo "Backend: Check Vercel dashboard"
        echo "Database: Supabase dashboard"
        ;;
        
    2)
        echo -e "\n${YELLOW}Deploying to Railway...${NC}"
        
        # Install Railway CLI if needed
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm i -g @railway/cli
        fi
        
        # One-click deploy
        echo -e "\n${BLUE}Initiating Railway deployment...${NC}"
        railway login
        railway init
        railway up
        
        echo -e "\n${GREEN}✅ Deployment initiated!${NC}"
        echo "Visit Railway dashboard to:"
        echo "1. Add PostgreSQL database"
        echo "2. Add Redis"
        echo "3. Set environment variables"
        echo "4. Get your app URL"
        ;;
        
    3)
        echo -e "\n${YELLOW}Starting local Docker deployment...${NC}"
        
        # Super simple docker-compose
        cat > docker-compose.quick.yml << EOF
version: '3.8'
services:
  app:
    image: ghcr.io/medusajs/medusa:latest
    ports:
      - "9000:9000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/medusa
      REDIS_URL: redis://cache:6379
      JWT_SECRET: $(openssl rand -hex 32)
      COOKIE_SECRET: $(openssl rand -hex 32)
      STORE_CORS: http://localhost:3000
    depends_on:
      - db
      - cache
  
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: medusa
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  cache:
    image: redis:7-alpine
    
volumes:
  postgres_data:
EOF
        
        docker-compose -f docker-compose.quick.yml up -d
        
        echo -e "\n${YELLOW}Waiting for services...${NC}"
        sleep 10
        
        echo -e "\n${GREEN}✅ Local deployment complete!${NC}"
        echo "Backend: http://localhost:9000"
        echo "Admin: http://localhost:9000/app"
        echo ""
        echo "Start frontend separately with: pnpm dev"
        ;;
esac

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Update .env.production with real values"
echo "2. Set up Stripe webhooks"
echo "3. Configure custom domain"
echo "4. Enable monitoring"
echo ""
echo -e "${GREEN}🎉 You're ready to go!${NC}"