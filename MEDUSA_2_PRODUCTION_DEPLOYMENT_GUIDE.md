# Medusa 2.0 Comprehensive Production Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Production Requirements](#production-requirements)
3. [Environment Variables](#environment-variables)
4. [Database Configuration](#database-configuration)
5. [Admin Panel Setup & Troubleshooting](#admin-panel-setup--troubleshooting)
6. [Production Modules Configuration](#production-modules-configuration)
7. [Railway Deployment Guide](#railway-deployment-guide)
8. [Render Deployment Guide](#render-deployment-guide)
9. [Performance Optimization](#performance-optimization)
10. [Security Best Practices](#security-best-practices)
11. [Monitoring & Logging](#monitoring--logging)
12. [Backup Strategies](#backup-strategies)
13. [Multi-Region & Multi-Currency Setup](#multi-region--multi-currency-setup)
14. [Common Production Issues & Solutions](#common-production-issues--solutions)

## Architecture Overview

Medusa 2.0 requires deploying your application in two modes:
- **Server Mode**: Handles incoming API requests and serves the Medusa Admin dashboard
- **Worker Mode**: Handles background tasks, scheduled jobs, and event subscribers

### Key Components
1. PostgreSQL database (main data store)
2. Redis database (sessions, cache, event bus, workflow engine)
3. Medusa application (deployed twice: server + worker)
4. File storage (S3 or compatible)
5. Email service (SendGrid or compatible)

## Production Requirements

### Minimum System Requirements
- **RAM**: At least 2GB per instance (4GB total for server + worker)
- **Node.js**: Version 18 or higher
- **Database**: PostgreSQL 13+ with at least 1GB storage
- **Redis**: Version 6+ with at least 512MB RAM

### Required Services
- PostgreSQL database
- Redis database
- File storage (S3, MinIO, or Supabase Storage)
- Email service (SendGrid, Resend, or SMTP)
- Domain with SSL certificate

## Environment Variables

### Critical Environment Variables

```bash
# Server Mode Instance
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://user:password@host:5432/medusa_db
REDIS_URL=redis://default:password@host:6379?family=0

# Security (Generate unique values!)
JWT_SECRET=your-secure-jwt-secret-here
COOKIE_SECRET=your-secure-cookie-secret-here

# CORS Configuration
STORE_CORS=https://your-storefront.com,https://www.your-storefront.com
ADMIN_CORS=https://your-medusa-app.com
AUTH_CORS=https://your-medusa-app.com

# Mode Configuration
MEDUSA_WORKER_MODE=server
DISABLE_MEDUSA_ADMIN=false

# Admin Configuration
MEDUSA_BACKEND_URL=https://your-medusa-app.com
MEDUSA_ADMIN_BACKEND_URL=https://your-medusa-app.com

# File Storage (S3)
S3_FILE_URL=https://your-bucket.s3.region.amazonaws.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM=noreply@your-domain.com

# Optional
HOST=0.0.0.0  # May be needed for some hosting providers
```

```bash
# Worker Mode Instance (Same as above except:)
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true
```

## Database Configuration

### PostgreSQL Setup

1. **Create Production Database**:
```sql
CREATE DATABASE medusa_production;
CREATE USER medusa_user WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE medusa_production TO medusa_user;
```

2. **Enable SSL/TLS** in `medusa-config.ts`:
```typescript
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  }
})
```

### Database Migrations

1. **Add predeploy script** to `package.json`:
```json
{
  "scripts": {
    "predeploy": "medusa db:migrate",
    "start": "medusa start"
  }
}
```

2. **Migration Commands**:
```bash
# Generate migrations for modules
medusa db:generate

# Run migrations
medusa db:migrate

# Rollback migrations
medusa db:rollback

# Create database and run migrations
medusa db:create
```

3. **Manual Migration Example**:
```typescript
// src/modules/custom/migrations/Migration20250628120000.ts
import { Migration } from '@mikro-orm/migrations';

export class Migration20250628120000 extends Migration {
  async up(): Promise<void> {
    this.addSql('CREATE TABLE custom_table (id SERIAL PRIMARY KEY, name VARCHAR(255))');
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE custom_table');
  }
}
```

## Admin Panel Setup & Troubleshooting

### Production Build Configuration

1. **Update `medusa-config.ts`**:
```typescript
module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    path: "app",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    develop: {
      open: false
    }
  }
})
```

2. **Build Command for Separate Deployment**:
```json
{
  "scripts": {
    "build:admin": "medusa-admin build --deployment"
  }
}
```

### Fixing White Screen Issues

**Most Common Fix** - Add to `package.json`:
```json
{
  "overrides": {
    "@swc/core": "1.11.21"
  },
  "resolutions": {
    "@swc/core": "1.11.21"
  }
}
```

Then:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Admin User Creation
```bash
# Production
npx medusa user --email admin@your-domain.com --password your-secure-password

# Using Railway CLI
railway run npx medusa user -e admin@your-domain.com -p supersecret
```

## Production Modules Configuration

### Complete `medusa-config.ts` for Production:

```typescript
import { defineConfig } from "@medusajs/framework/utils"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    http: {
      storeCors: process.env.STORE_CORS,
      adminCors: process.env.ADMIN_CORS,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as "server" | "worker"
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    path: "app",
    backendUrl: process.env.MEDUSA_BACKEND_URL
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        ttl: 30
      }
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL
      }
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL
        }
      }
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              aws_config_object: {
                signatureVersion: "v4"
              }
            }
          }
        ]
      }
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM
            }
          }
        ]
      }
    }
  ]
})
```

## Railway Deployment Guide

### Step 1: Prepare Project

1. **Install production dependencies**:
```bash
npm install @medusajs/medusa@rc \
  @medusajs/cache-redis@rc \
  @medusajs/event-bus-redis@rc \
  @medusajs/workflow-engine-redis@rc \
  @medusajs/file-s3@rc \
  @medusajs/notification-sendgrid@rc
```

2. **Update `package.json`**:
```json
{
  "scripts": {
    "build": "medusa build",
    "predeploy": "medusa db:migrate",
    "start": "medusa start",
    "start:server": "npm run predeploy && npm run start",
    "start:worker": "npm run predeploy && npm run start"
  }
}
```

### Step 2: Deploy to Railway

1. **Create New Project** in Railway Dashboard

2. **Add PostgreSQL**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Note the `DATABASE_URL` variable

3. **Add Redis**:
   - Click "New" → "Database" → "Add Redis"
   - Note the `REDIS_URL` variable

4. **Deploy Server Instance**:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Configure environment variables:
   ```
   PORT=9000
   NODE_ENV=production
   JWT_SECRET=<generate-secure-secret>
   COOKIE_SECRET=<generate-secure-secret>
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}?family=0
   DISABLE_MEDUSA_ADMIN=false
   MEDUSA_WORKER_MODE=server
   STORE_CORS=https://your-storefront.com
   ADMIN_CORS=https://your-railway-app.up.railway.app
   AUTH_CORS=https://your-railway-app.up.railway.app
   MEDUSA_BACKEND_URL=https://your-railway-app.up.railway.app
   ```
   - Set Start Command: `npm run start:server`
   - Deploy

5. **Deploy Worker Instance**:
   - Create another service from same repo
   - Configure environment variables (same as server except):
   ```
   DISABLE_MEDUSA_ADMIN=true
   MEDUSA_WORKER_MODE=worker
   ```
   - Set Start Command: `npm run start:worker`
   - Deploy

6. **Configure Domain**:
   - Go to server instance settings
   - Add custom domain or use Railway-provided domain
   - Enable HTTPS

### Step 3: Post-Deployment

1. **Link with Railway CLI**:
```bash
railway link
railway run npx medusa user -e admin@example.com -p password
```

2. **Verify Deployment**:
- Health Check: `https://your-app.railway.app/health`
- Admin Panel: `https://your-app.railway.app/app`

## Render Deployment Guide

### Step 1: Prepare for Render

1. **Create `render.yaml`**:
```yaml
databases:
  - name: medusa-postgres
    databaseName: medusa_production
    plan: starter

  - name: medusa-redis
    type: redis
    plan: starter

services:
  - type: web
    name: medusa-server
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start:server
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 9000
      - key: DATABASE_URL
        fromDatabase:
          name: medusa-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: medusa-redis
          property: connectionString
      - key: MEDUSA_WORKER_MODE
        value: server
      - key: DISABLE_MEDUSA_ADMIN
        value: false
      - key: JWT_SECRET
        generateValue: true
      - key: COOKIE_SECRET
        generateValue: true

  - type: worker
    name: medusa-worker
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start:worker
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: medusa-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: medusa-redis
          property: connectionString
      - key: MEDUSA_WORKER_MODE
        value: worker
      - key: DISABLE_MEDUSA_ADMIN
        value: true
      - key: JWT_SECRET
        sync: false
      - key: COOKIE_SECRET
        sync: false
```

2. **Deploy to Render**:
   - Push `render.yaml` to your repository
   - Connect GitHub repo to Render
   - Deploy using Blueprint

### Step 2: Configure Render Services

1. **Environment Variables** (add manually):
   - `MEDUSA_BACKEND_URL`: Your Render app URL
   - `STORE_CORS`: Your storefront URL
   - `ADMIN_CORS`: Your Render app URL
   - `AUTH_CORS`: Your Render app URL
   - S3 credentials
   - Email service credentials

2. **Health Checks**:
   - Path: `/health`
   - HTTP Method: GET
   - Timeout: 30 seconds

## Performance Optimization

### 1. Database Optimization

```typescript
// Add connection pooling
module.exports = defineConfig({
  projectConfig: {
    databaseDriverOptions: {
      connection: {
        ssl: { rejectUnauthorized: false }
      },
      pool: {
        min: 2,
        max: 10
      }
    }
  }
})
```

### 2. Redis Configuration

```typescript
// Optimize Redis caching
{
  resolve: "@medusajs/medusa/cache-redis",
  options: {
    redisUrl: process.env.REDIS_URL,
    ttl: 30, // seconds
    namespace: "medusa",
    // Specific TTLs
    ttls: {
      "product:*": 3600, // 1 hour for products
      "cart:*": 300 // 5 minutes for carts
    }
  }
}
```

### 3. API Response Optimization

```typescript
// In custom API routes
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Enable caching headers
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  
  // Use pagination
  const { offset = 0, limit = 20 } = req.query;
  
  // Implement field selection
  const { fields } = req.query;
  const select = fields ? fields.split(',') : undefined;
  
  // Return optimized response
  return res.json({
    data: results,
    count: total,
    offset,
    limit
  });
}
```

### 4. Image Optimization

```typescript
// S3 configuration with CloudFront
{
  resolve: "@medusajs/medusa/file-s3",
  options: {
    file_url: process.env.CLOUDFRONT_URL || process.env.S3_FILE_URL,
    // ... other options
  }
}
```

## Security Best Practices

### 1. Environment Variables Security

```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For COOKIE_SECRET
```

### 2. API Security

```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to routes
export const middlewares = [limiter];
```

### 3. Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE medusa_production TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
```

### 4. Headers Security

```typescript
// Security headers middleware
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}
```

## Monitoring & Logging

### 1. Health Endpoints

```typescript
// Custom health check
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Check database
    await dataSource.query('SELECT 1');
    
    // Check Redis
    const redis = req.scope.resolve('cacheService');
    await redis.get('health-check');
    
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        mode: process.env.MEDUSA_WORKER_MODE
      }
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

### 2. Structured Logging

```typescript
// Use a logger module
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// In production, add external logging service
if (process.env.NODE_ENV === 'production') {
  // Add Datadog, LogDNA, etc.
}
```

### 3. APM Integration

```typescript
// Example with Datadog
import tracer from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  tracer.init({
    service: 'medusa-backend',
    env: process.env.DD_ENV || 'production',
    version: process.env.APP_VERSION
  });
}
```

## Backup Strategies

### 1. Database Backups

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="medusa_production"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/postgres/

# Clean old local backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### 2. Redis Backups

```bash
# Redis backup configuration
redis-cli CONFIG SET save "900 1 300 10 60 10000"
redis-cli CONFIG SET dbfilename "dump.rdb"
redis-cli CONFIG SET dir "/var/lib/redis"

# Backup command
redis-cli BGSAVE
```

### 3. File Storage Backups

```bash
# S3 to S3 backup using AWS CLI
aws s3 sync s3://production-bucket s3://backup-bucket \
  --storage-class GLACIER \
  --delete
```

### 4. Backup Automation

```yaml
# GitHub Action for daily backups
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump $DATABASE_URL | gzip > backup.sql.gz
          
      - name: Upload to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl private
        env:
          AWS_S3_BUCKET: ${{ secrets.BACKUP_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Multi-Region & Multi-Currency Setup

### 1. Region Configuration

```typescript
// Create regions via API or admin
const regions = [
  {
    name: "North America",
    currency_code: "usd",
    tax_rate: 0.08,
    payment_providers: ["stripe"],
    fulfillment_providers: ["manual"],
    countries: ["us", "ca"]
  },
  {
    name: "Europe",
    currency_code: "eur",
    tax_rate: 0.20,
    payment_providers: ["stripe", "paypal"],
    fulfillment_providers: ["manual", "dhl"],
    countries: ["de", "fr", "it", "es"]
  },
  {
    name: "Asia Pacific",
    currency_code: "jpy",
    tax_rate: 0.10,
    payment_providers: ["stripe"],
    fulfillment_providers: ["manual"],
    countries: ["jp", "sg", "au"]
  }
];
```

### 2. Multi-Currency Support

```typescript
// Currency module configuration
{
  resolve: "@medusajs/medusa/currency",
  options: {
    // Enable automatic exchange rate updates
    enableAutomaticRates: true,
    
    // Exchange rate provider
    rateProvider: {
      resolve: "@medusajs/currency-exchangerate-api",
      options: {
        apiKey: process.env.EXCHANGE_RATE_API_KEY,
        updateInterval: 3600000 // 1 hour
      }
    }
  }
}
```

### 3. Stock Locations

```typescript
// Multi-warehouse configuration
const stockLocations = [
  {
    name: "US East Warehouse",
    address: {
      address_1: "123 Commerce St",
      city: "New York",
      country_code: "us",
      postal_code: "10001"
    }
  },
  {
    name: "EU Central Warehouse",
    address: {
      address_1: "456 Trade Ave",
      city: "Frankfurt",
      country_code: "de",
      postal_code: "60311"
    }
  }
];
```

### 4. Region-Specific Pricing

```typescript
// Product variant pricing per region
const pricing = {
  variant_id: "variant_123",
  prices: [
    {
      currency_code: "usd",
      amount: 1999, // $19.99
      region_id: "region_NA"
    },
    {
      currency_code: "eur",
      amount: 1799, // €17.99
      region_id: "region_EU"
    },
    {
      currency_code: "jpy",
      amount: 2500, // ¥2,500
      region_id: "region_APAC"
    }
  ]
};
```

## Common Production Issues & Solutions

### Issue 1: Admin Panel White Screen

**Symptoms**: Admin works in dev but shows white screen in production

**Solutions**:
1. Fix SWC version conflict:
```json
{
  "overrides": {
    "@swc/core": "1.11.21"
  }
}
```

2. Check CORS settings:
```bash
ADMIN_CORS=https://your-actual-domain.com
```

3. Verify build output:
```bash
ls -la .medusa/server/public/app/
# Should contain index.html and assets
```

### Issue 2: Worker Not Processing Jobs

**Symptoms**: Scheduled jobs and events not running

**Solutions**:
1. Verify worker mode:
```bash
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true
```

2. Check Redis connection:
```bash
redis-cli -u $REDIS_URL ping
# Should return PONG
```

3. Review worker logs for errors

### Issue 3: File Upload Failures

**Symptoms**: Images/files not uploading to S3

**Solutions**:
1. Verify S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

2. Check CORS configuration on S3 bucket:
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

### Issue 4: Database Connection Drops

**Symptoms**: Intermittent 500 errors

**Solutions**:
1. Add connection pooling:
```typescript
databaseDriverOptions: {
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
}
```

2. Implement retry logic:
```typescript
databaseDriverOptions: {
  connection: {
    ssl: { rejectUnauthorized: false }
  },
  acquireConnectionTimeout: 60000
}
```

### Issue 5: High Memory Usage

**Symptoms**: Application crashes with OOM errors

**Solutions**:
1. Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096"
```

2. Optimize queries:
```typescript
// Use select to limit fields
const products = await productService.list({
  select: ["id", "title", "handle"]
}, {
  take: 20,
  skip: 0
});
```

3. Implement caching aggressively

### Issue 6: Slow API Response Times

**Symptoms**: API requests taking > 3 seconds

**Solutions**:
1. Enable query optimization:
```typescript
// Add indexes
this.addSql('CREATE INDEX idx_product_handle ON product(handle)');
```

2. Use Redis caching:
```typescript
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await expensiveOperation();
await cache.set(cacheKey, result, 300); // 5 min TTL
return result;
```

3. Implement pagination:
```typescript
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const limit = Math.min(req.query.limit || DEFAULT_LIMIT, MAX_LIMIT);
```

## Production Checklist

- [ ] Environment variables set for both server and worker
- [ ] Database migrations run successfully
- [ ] Redis connected and tested
- [ ] Admin user created
- [ ] SSL certificates configured
- [ ] CORS settings verified
- [ ] File uploads tested
- [ ] Email sending verified
- [ ] Health endpoints accessible
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security headers added
- [ ] Rate limiting enabled
- [ ] Error tracking setup
- [ ] Load testing completed

## Medusa CLI Commands for Production

```bash
# Build application
medusa build

# Run migrations
medusa db:migrate

# Create admin user
medusa user --email admin@example.com

# Start in production
medusa start

# Generate migrations
medusa db:generate

# Rollback migrations
medusa db:rollback

# Seed database (use with caution in production!)
medusa seed

# Development commands (DO NOT use in production)
medusa develop  # Never use this in production
```

This comprehensive guide covers all aspects of Medusa 2.0 production deployment. Follow these guidelines carefully, especially the security recommendations and backup strategies, to ensure a robust and scalable e-commerce platform.