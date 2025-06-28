#!/bin/bash

# One-command script to apply all critical fixes
# Run this to automatically fix all issues

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Applying Critical Fixes for Medusa Production${NC}"
echo "================================================"

# Change to backend directory
cd backend

# Step 1: Fix Redis URL
echo -e "\n${YELLOW}1. Fixing Redis URL...${NC}"
if grep -q "REDIS_URL=redis://localhost:6379$" .env 2>/dev/null; then
    sed -i.bak 's|REDIS_URL=redis://localhost:6379|REDIS_URL=redis://localhost:6379?family=0|g' .env
    echo -e "${GREEN}✅ Redis URL updated with ?family=0${NC}"
else
    echo -e "${YELLOW}⚠️  Redis URL already contains parameters or not found${NC}"
fi

# Step 2: Fix package.json
echo -e "\n${YELLOW}2. Fixing @swc/core version...${NC}"
if ! grep -q "overrides" package.json; then
    # Backup
    cp package.json package.json.backup
    
    # Add overrides
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.overrides = {
      '@swc/core': '1.3.96',
      '@swc/helpers': '0.5.2'
    };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo -e "${GREEN}✅ Added @swc/core overrides${NC}"
else
    echo -e "${YELLOW}⚠️  Overrides already exist${NC}"
fi

# Step 3: Create database config
echo -e "\n${YELLOW}3. Creating database configuration...${NC}"
mkdir -p src/utils
cat > src/utils/database-config.ts << 'EOF'
export const getDatabaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(process.env.DATABASE_URL);
  
  // Add pooling parameters to connection string
  const poolParams = [
    'pool_min=2',
    'pool_max=10',
    'pool_timeout=60000',
    'idle_timeout=30000',
    'connect_timeout=10000'
  ].join('&');

  // Append pool parameters
  const separator = url.search ? '&' : '?';
  const pooledUrl = `${process.env.DATABASE_URL}${separator}${poolParams}`;

  return {
    url: pooledUrl,
    options: {
      logging: process.env.NODE_ENV !== 'production',
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false
    }
  };
};
EOF
echo -e "${GREEN}✅ Database configuration created${NC}"

# Step 4: Create startup validation
echo -e "\n${YELLOW}4. Creating environment validation...${NC}"
mkdir -p src/scripts
cat > src/scripts/startup-check.ts << 'EOF'
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'COOKIE_SECRET',
  'STRIPE_API_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

export function validateEnvironment() {
  console.log('🔍 Validating environment variables...');
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
      
      // Helpful hints
      if (key === 'JWT_SECRET' || key === 'COOKIE_SECRET') {
        console.error(`     Run: openssl rand -hex 32`);
      }
      if (key === 'REDIS_URL') {
        console.error(`     Format: redis://host:port?family=0`);
      }
    });
    process.exit(1);
  }

  // Check Redis URL format
  if (!process.env.REDIS_URL!.includes('?family=')) {
    console.error('❌ REDIS_URL must include ?family=0 or ?family=4');
    console.error(`   Current: ${process.env.REDIS_URL}`);
    console.error(`   Expected: ${process.env.REDIS_URL}?family=0`);
    process.exit(1);
  }

  console.log('✅ All environment variables validated');
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  validateEnvironment();
}
EOF
echo -e "${GREEN}✅ Environment validation created${NC}"

# Step 5: Update medusa-config.ts to use database config
echo -e "\n${YELLOW}5. Updating medusa-config.ts...${NC}"
if [ -f "medusa-config.ts" ]; then
    # Check if import already exists
    if ! grep -q "getDatabaseConfig" medusa-config.ts; then
        # Add import at the top
        sed -i.bak '1s/^/import { getDatabaseConfig } from ".\/src\/utils\/database-config"\n/' medusa-config.ts
        echo -e "${GREEN}✅ Updated medusa-config.ts${NC}"
    else
        echo -e "${YELLOW}⚠️  medusa-config.ts already imports getDatabaseConfig${NC}"
    fi
fi

# Step 6: Create production env template
echo -e "\n${YELLOW}6. Creating production environment template...${NC}"
if [ ! -f ".env.production" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 32)
    
    cat > .env.production << EOF
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET
DATABASE_URL=\${{DATABASE_URL}}
REDIS_URL=\${{REDIS_URL}}?family=0
STRIPE_API_KEY=your_stripe_live_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
ADMIN_CORS=\${{RAILWAY_STATIC_URL}}
STORE_CORS=https://your-frontend.vercel.app
AUTH_CORS=\${{RAILWAY_STATIC_URL}}
EOF
    echo -e "${GREEN}✅ Production environment template created${NC}"
    echo -e "${YELLOW}   Generated JWT_SECRET and COOKIE_SECRET${NC}"
else
    echo -e "${YELLOW}⚠️  .env.production already exists${NC}"
fi

# Step 7: Clean install dependencies
echo -e "\n${YELLOW}7. Reinstalling dependencies...${NC}"
read -p "Do you want to reinstall dependencies? This will take a few minutes [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules yarn.lock
    yarn install
    echo -e "${GREEN}✅ Dependencies reinstalled${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped dependency reinstall${NC}"
fi

# Step 8: Run verification
echo -e "\n${YELLOW}8. Running verification...${NC}"
cd ..
chmod +x scripts/verify-fixes.sh
./scripts/verify-fixes.sh

echo -e "\n${BLUE}================================================${NC}"
echo -e "${GREEN}🎉 Critical fixes applied!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes made"
echo "2. Test locally: cd backend && yarn build && yarn start"
echo "3. Deploy to Railway: ./scripts/deploy-railway.sh"
echo ""
echo -e "${YELLOW}Important files created/modified:${NC}"
echo "- backend/.env (Redis URL fixed)"
echo "- backend/package.json (SWC override added)"
echo "- backend/src/utils/database-config.ts"
echo "- backend/src/scripts/startup-check.ts"
echo "- backend/.env.production (with generated secrets)"

cd backend