#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     INDECISIVE WEAR - QUICK DEPLOY        ║"
echo "║         Production in 30 Minutes          ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure random string
generate_secret() {
    openssl rand -hex 32
}

# Check required dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

MISSING_DEPS=()

if ! command_exists docker; then
    MISSING_DEPS+=("docker")
fi

if ! command_exists git; then
    MISSING_DEPS+=("git")
fi

if ! command_exists node; then
    MISSING_DEPS+=("node")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo -e "${RED}Missing required dependencies: ${MISSING_DEPS[*]}${NC}"
    echo "Please install missing dependencies and try again."
    exit 1
fi

echo -e "${GREEN}✓ All dependencies installed${NC}"

# Create .env if it doesn't exist
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating production environment file...${NC}"
    
    JWT_SECRET=$(generate_secret)
    COOKIE_SECRET=$(generate_secret)
    
    cat > .env.production << EOF
# Generated Secrets (DO NOT SHARE)
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Database Configuration
DATABASE_URL=postgresql://medusa:medusa@postgres:5432/medusa

# Redis Configuration (optional for MVP)
REDIS_URL=redis://redis:6379

# Stripe Configuration (use test keys for development)
STRIPE_API_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Supabase Configuration (for file storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=product-images

# CORS Configuration
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000,http://localhost:7001
AUTH_CORS=http://localhost:3000,http://localhost:9000

# Node Environment
NODE_ENV=production
EOF

    echo -e "${GREEN}✓ Environment file created${NC}"
    echo -e "${YELLOW}⚠️  Please update .env.production with your actual service credentials${NC}"
fi

# Deployment menu
echo ""
echo -e "${BLUE}Select deployment option:${NC}"
echo "1) Local Docker (Development)"
echo "2) Railway (Recommended for MVP)"
echo "3) Render.com (Free tier available)"
echo "4) VPS with Docker"
echo "5) Vercel + Supabase (Serverless)"
echo ""
read -p "Enter your choice (1-5): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        echo -e "${YELLOW}Deploying locally with Docker...${NC}"
        
        # Build and start containers
        docker-compose -f docker-compose.production.yml build
        docker-compose -f docker-compose.production.yml up -d
        
        # Wait for services to be healthy
        echo -e "${YELLOW}Waiting for services to start...${NC}"
        sleep 10
        
        # Run database migrations
        echo -e "${YELLOW}Running database migrations...${NC}"
        docker-compose -f docker-compose.production.yml exec backend yarn medusa migrations run
        
        # Seed initial data (optional)
        read -p "Do you want to seed demo data? (y/n): " SEED_CHOICE
        if [ "$SEED_CHOICE" = "y" ]; then
            docker-compose -f docker-compose.production.yml exec backend yarn seed
        fi
        
        echo -e "${GREEN}✅ Local deployment complete!${NC}"
        echo ""
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend: http://localhost:9000"
        echo "👤 Admin: http://localhost:9000/app"
        echo ""
        echo "To view logs: docker-compose -f docker-compose.production.yml logs -f"
        ;;
        
    2)
        echo -e "${YELLOW}Deploying to Railway...${NC}"
        
        # Check if Railway CLI is installed
        if ! command_exists railway; then
            echo -e "${RED}Railway CLI not installed.${NC}"
            echo "Install it with: npm install -g @railway/cli"
            exit 1
        fi
        
        # Login to Railway
        railway login
        
        # Create Railway project
        echo -e "${YELLOW}Creating Railway project...${NC}"
        railway init
        
        # Deploy services
        echo -e "${YELLOW}Deploying backend...${NC}"
        cd backend
        railway up
        cd ..
        
        echo -e "${YELLOW}Deploying frontend...${NC}"
        railway up
        
        echo -e "${GREEN}✅ Railway deployment initiated!${NC}"
        echo "Visit your Railway dashboard to complete setup"
        echo "Don't forget to add environment variables!"
        ;;
        
    3)
        echo -e "${YELLOW}Deploying to Render...${NC}"
        
        # Create render.yaml if it doesn't exist
        if [ ! -f render.yaml ]; then
            cat > render.yaml << EOF
services:
  # Backend Service
  - type: web
    name: indecisive-wear-backend
    env: node
    buildCommand: cd backend && yarn install && yarn build
    startCommand: cd backend && yarn start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: medusa-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: medusa-redis
          type: pserv
          property: connectionString

  # Frontend Service
  - type: web
    name: indecisive-wear-frontend
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NEXT_PUBLIC_MEDUSA_BACKEND_URL
        value: https://indecisive-wear-backend.onrender.com

databases:
  - name: medusa-db
    plan: free
    databaseName: medusa
    user: medusa

services:
  - type: pserv
    name: medusa-redis
    env: docker
    dockerfilePath: ./Dockerfile.redis
    plan: free
EOF
        fi
        
        echo -e "${GREEN}✓ render.yaml created${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Push your code to GitHub"
        echo "2. Connect your GitHub repo to Render"
        echo "3. Render will automatically deploy using render.yaml"
        echo ""
        echo "Visit: https://render.com/docs/blueprint-spec"
        ;;
        
    4)
        echo -e "${YELLOW}Deploying to VPS...${NC}"
        
        read -p "Enter your VPS SSH connection (user@host): " SSH_CONN
        read -p "Enter deployment directory on VPS [/opt/indecisive-wear]: " DEPLOY_DIR
        DEPLOY_DIR=${DEPLOY_DIR:-/opt/indecisive-wear}
        
        # Create deployment script
        cat > remote-deploy.sh << 'EOF'
#!/bin/bash
set -e

DEPLOY_DIR="$1"

# Update system
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git

# Clone repository
if [ ! -d "$DEPLOY_DIR" ]; then
    sudo git clone https://github.com/your-repo/indecisive-wear-store "$DEPLOY_DIR"
else
    cd "$DEPLOY_DIR"
    sudo git pull
fi

cd "$DEPLOY_DIR"

# Copy environment file
if [ ! -f .env.production ]; then
    echo "Please create .env.production file"
    exit 1
fi

# Start services
sudo docker-compose -f docker-compose.production.yml pull
sudo docker-compose -f docker-compose.production.yml up -d

# Run migrations
sleep 10
sudo docker-compose -f docker-compose.production.yml exec -T backend yarn medusa migrations run

echo "Deployment complete!"
EOF
        
        # Copy files to VPS
        echo -e "${YELLOW}Copying files to VPS...${NC}"
        scp .env.production remote-deploy.sh docker-compose.production.yml $SSH_CONN:/tmp/
        
        # Execute deployment
        ssh $SSH_CONN "sudo bash /tmp/remote-deploy.sh $DEPLOY_DIR"
        
        echo -e "${GREEN}✅ VPS deployment complete!${NC}"
        ;;
        
    5)
        echo -e "${YELLOW}Deploying to Vercel + Supabase...${NC}"
        
        # Check if Vercel CLI is installed
        if ! command_exists vercel; then
            echo -e "${RED}Vercel CLI not installed.${NC}"
            echo "Install it with: npm install -g vercel"
            exit 1
        fi
        
        # Deploy frontend to Vercel
        echo -e "${YELLOW}Deploying frontend to Vercel...${NC}"
        vercel --prod
        
        echo ""
        echo -e "${YELLOW}Backend deployment instructions:${NC}"
        echo "1. Create a new Supabase project at https://supabase.com"
        echo "2. Use Supabase database for Medusa backend"
        echo "3. Deploy backend to Vercel Functions or Railway"
        echo ""
        echo "Serverless backend guide: https://docs.medusajs.com/deployment/serverless"
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Post-deployment tasks
echo ""
echo -e "${BLUE}Post-deployment checklist:${NC}"
echo "□ Update environment variables with production values"
echo "□ Configure Stripe webhooks"
echo "□ Set up SSL certificates"
echo "□ Configure custom domain"
echo "□ Set up monitoring (Better Stack, Sentry)"
echo "□ Configure backups"
echo "□ Test payment flow"
echo ""
echo -e "${GREEN}🎉 Deployment script completed!${NC}"