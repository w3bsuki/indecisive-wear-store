#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Indecisive Wear - Environment Setup${NC}"
echo ""

# Function to generate secure secrets
generate_secret() {
    openssl rand -hex 32
}

# Generate secrets
echo -e "${YELLOW}Generating secure secrets...${NC}"
JWT_SECRET=$(generate_secret)
COOKIE_SECRET=$(generate_secret)
ADMIN_PASSWORD=$(generate_secret | cut -c1-16)

# Create development environment file
cat > .env.local << EOF
# Generated Secrets (DO NOT COMMIT)
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Database Configuration
DATABASE_URL=postgresql://postgres:supersecret@localhost:5433/medusa-db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Stripe Configuration (Test Keys)
STRIPE_API_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=product-images

# CORS Configuration
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000,http://localhost:7001
AUTH_CORS=http://localhost:3000,http://localhost:9000

# Admin Credentials
ADMIN_EMAIL=admin@indecisivewear.com
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Node Environment
NODE_ENV=development
EOF

# Create production environment template
cat > .env.production.template << EOF
# Production Environment Variables Template
# Copy this to .env.production and fill in your values

# Generated Secrets (Use the ones from setup or generate new)
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Database Configuration (Update with your production database)
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Redis Configuration (Update with your Redis instance)
REDIS_URL=redis://user:password@host:6379

# Stripe Configuration (Production Keys)
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=product-images

# CORS Configuration (Update with your domains)
STORE_CORS=https://your-store.com
ADMIN_CORS=https://admin.your-store.com
AUTH_CORS=https://your-store.com,https://admin.your-store.com

# Node Environment
NODE_ENV=production

# Additional Production Settings
LOG_LEVEL=info
ENABLE_HTTPS=true
FORCE_SSL=true
EOF

# Create frontend environment file
cat > .env.local.frontend << EOF
# Frontend Environment Variables
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

# Create Docker environment file
cat > .env.docker << EOF
# Docker Compose Environment Variables
COMPOSE_PROJECT_NAME=indecisive-wear
DB_PASSWORD=$ADMIN_PASSWORD
REDIS_PASSWORD=
EOF

echo -e "${GREEN}✅ Environment files created successfully!${NC}"
echo ""
echo -e "${BLUE}Created files:${NC}"
echo "  - .env.local (for local development)"
echo "  - .env.production.template (template for production)"
echo "  - .env.local.frontend (frontend specific)"
echo "  - .env.docker (Docker Compose variables)"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update .env.local with your service credentials:"
echo "   - Stripe API keys from https://dashboard.stripe.com"
echo "   - Supabase credentials from https://supabase.com"
echo ""
echo "2. For production deployment:"
echo "   - Copy .env.production.template to .env.production"
echo "   - Update with production credentials"
echo ""
echo -e "${BLUE}🔐 Admin Credentials:${NC}"
echo "Email: admin@indecisivewear.com"
echo "Password: $ADMIN_PASSWORD"
echo ""
echo -e "${YELLOW}⚠️  Security Notes:${NC}"
echo "- Never commit .env files to version control"
echo "- Add *.env* to your .gitignore"
echo "- Rotate secrets regularly in production"
echo "- Use environment-specific credentials"