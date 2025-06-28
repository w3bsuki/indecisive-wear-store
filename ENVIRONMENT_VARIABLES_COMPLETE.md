# Complete Environment Variables Documentation

## Overview
This document contains ALL environment variables needed for production deployment across all services.

## 1. Backend (Medusa) Environment Variables

### Core Configuration
```bash
# Node Environment
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"

# Server Configuration
PORT=9000
MEDUSA_WORKER_MODE=server  # or "worker" for worker instance
DISABLE_MEDUSA_ADMIN=false  # Set to true for worker instances

# Database
DATABASE_URL=postgresql://user:password@host:5432/medusa_db
DATABASE_TYPE=postgres
DATABASE_EXTRA='{"ssl":{"rejectUnauthorized":false}}'
DATABASE_LOGGING=false

# Redis (MUST include ?family=0 or ?family=4)
REDIS_URL=redis://default:password@host:6379?family=0
```

### Security Keys (REQUIRED - Generate these!)
```bash
# Generate with: openssl rand -hex 32
JWT_SECRET=your-32-character-hex-string-here
COOKIE_SECRET=your-32-character-hex-string-here

# Admin credentials (optional, for first setup)
MEDUSA_ADMIN_EMAIL=admin@yourdomain.com
MEDUSA_ADMIN_PASSWORD=your-secure-password
```

### CORS Configuration
```bash
# Use your actual domain URLs
ADMIN_CORS=https://api.yourdomain.com,http://localhost:9000
STORE_CORS=https://yourdomain.com,http://localhost:3000
AUTH_CORS=https://api.yourdomain.com,http://localhost:9000
```

### Medusa Modules
```bash
# File Storage (S3 or Supabase)
MEDUSA_FILE_S3_BUCKET_NAME=your-bucket-name
MEDUSA_FILE_S3_REGION=us-east-1
MEDUSA_FILE_S3_ACCESS_KEY_ID=your-access-key
MEDUSA_FILE_S3_SECRET_ACCESS_KEY=your-secret-key
MEDUSA_FILE_S3_ENDPOINT=https://s3.amazonaws.com  # Or Supabase Storage URL

# Email (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM=noreply@yourdomain.com
SENDGRID_ORDER_PLACED_ID=d-templateid
SENDGRID_ORDER_SHIPPED_ID=d-templateid
SENDGRID_CUSTOMER_PASSWORD_RESET_ID=d-templateid
SENDGRID_USER_PASSWORD_RESET_ID=d-templateid

# Search (Optional - Algolia/MeiliSearch)
MEILISEARCH_HOST=https://your-meilisearch-host.com
MEILISEARCH_API_KEY=your-master-key
```

### Stripe Configuration
```bash
# Live keys for production
STRIPE_API_KEY=sk_live_51xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Webhook endpoint (update with your domain)
STRIPE_WEBHOOK_ENDPOINT_URL=https://api.yourdomain.com/api/hooks/payment/stripe

# Payment settings
STRIPE_CAPTURE_AUTOMATIC=true
STRIPE_PAYMENT_DESCRIPTION="Order from YourStore"
```

### Supabase Integration
```bash
# Supabase connection
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
SUPABASE_BUCKET=product-images
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
```

### Deployment Platform Specific

#### Railway
```bash
# Railway provides these automatically
RAILWAY_STATIC_URL=${{RAILWAY_STATIC_URL}}
RAILWAY_ENVIRONMENT=${{RAILWAY_ENVIRONMENT}}
RAILWAY_PROJECT_ID=${{RAILWAY_PROJECT_ID}}

# Reference other services
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}?family=0
```

#### Render
```bash
# Render provides these
RENDER_SERVICE_NAME=medusa-api
RENDER_EXTERNAL_URL=https://medusa-api.onrender.com
RENDER_INSTANCE_ID=${{RENDER_INSTANCE_ID}}

# Health check path
HEALTH_CHECK_PATH=/health
```

## 2. Frontend (Next.js) Environment Variables

### Public Variables (Exposed to Browser)
```bash
# API URLs
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx  # If using publishable API keys

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxx
NEXT_PUBLIC_STRIPE_LOCALE=en-US
NEXT_PUBLIC_STRIPE_CURRENCY=usd

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME="Your Store Name"
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_REVIEWS=true

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Server-Side Variables (Private)
```bash
# Medusa Admin Access
MEDUSA_ADMIN_TOKEN=your-admin-api-token
MEDUSA_API_KEY=your-api-key  # For server-side requests

# Stripe Server
STRIPE_SECRET_KEY=sk_live_51xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase Server
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# Revalidation
REVALIDATE_SECRET=your-revalidation-secret

# Error Tracking
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Vercel Specific
```bash
# Vercel provides these
VERCEL_URL=${{VERCEL_URL}}
VERCEL_ENV=${{VERCEL_ENV}}
VERCEL_REGION=${{VERCEL_REGION}}

# Edge config
EDGE_CONFIG=https://edge-config.vercel.com/xxx
```

## 3. Development vs Production

### Development (.env.development)
```bash
# Backend Dev
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa_dev
REDIS_URL=redis://localhost:6379
ADMIN_CORS=http://localhost:9000
STORE_CORS=http://localhost:3000
JWT_SECRET=development-jwt-secret-change-in-production
COOKIE_SECRET=development-cookie-secret-change-in-production

# Frontend Dev
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxx
```

### Production (.env.production)
```bash
# Use all the production values listed above
# NEVER commit production secrets to git
# Use platform secret management
```

## 4. Secret Management Best Practices

### Generate Secure Secrets
```bash
#!/bin/bash
# generate-secrets.sh

echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "COOKIE_SECRET=$(openssl rand -hex 32)"
echo "REVALIDATE_SECRET=$(openssl rand -hex 32)"
echo "DATABASE_PASSWORD=$(openssl rand -base64 32)"
```

### Platform Secret Management

#### Railway
```bash
# Set secrets via CLI
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# Or import .env file
railway variables import < .env.production
```

#### Render
```bash
# Use dashboard or CLI
render secrets:set JWT_SECRET=$(openssl rand -hex 32)
```

#### Vercel
```bash
# Set for all environments
vercel env add JWT_SECRET production

# Import from file
vercel env pull .env.production
```

## 5. Validation Script

Create a script to validate all required env vars:

```javascript
// scripts/validate-env.js
const required = {
  backend: [
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'COOKIE_SECRET',
    'STRIPE_API_KEY',
    'ADMIN_CORS',
    'STORE_CORS'
  ],
  frontend: [
    'NEXT_PUBLIC_MEDUSA_BACKEND_URL',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
}

function validateEnv(type) {
  const missing = required[type].filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables:`)
    missing.forEach(key => console.error(`  - ${key}`))
    process.exit(1)
  }
  
  console.log(`✅ All ${type} environment variables are set`)
}

// Usage: node validate-env.js backend
validateEnv(process.argv[2])
```

## 6. Environment Variable Templates

### backend/.env.template
```bash
# Copy to .env and fill in values
NODE_ENV=
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
COOKIE_SECRET=
ADMIN_CORS=
STORE_CORS=
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### .env.template (frontend)
```bash
# Copy to .env.local and fill in values
NEXT_PUBLIC_MEDUSA_BACKEND_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Critical Notes

1. **NEVER commit secrets to Git**
2. **Always use HTTPS URLs in production**
3. **Redis URL must include ?family=0 or ?family=4**
4. **Generate new secrets for each environment**
5. **Rotate secrets regularly**
6. **Use platform secret management**
7. **Validate env vars before deployment**
8. **Keep development and production separate**