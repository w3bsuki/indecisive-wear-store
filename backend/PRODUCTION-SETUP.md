# Production Setup Guide

This guide covers the production-ready features implemented for the Indecisive Wear Store backend.

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Database Connection Pooling](#database-connection-pooling)
3. [Health Monitoring](#health-monitoring)
4. [Worker Management](#worker-management)
5. [CORS Configuration](#cors-configuration)
6. [Stripe Webhooks](#stripe-webhooks)
7. [Redis Caching](#redis-caching)
8. [Production Deployment](#production-deployment)

## Environment Configuration

### Validate Environment Variables

Before starting the application in production, validate all required environment variables:

```bash
yarn validate:env
```

### Generate Environment Template

Create a template `.env` file with all required variables:

```bash
yarn env:template
```

### Required Environment Variables

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/medusa_db
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_SSL=true

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
COOKIE_SECRET=your-super-secret-cookie-key-minimum-32-chars

# CORS
STORE_CORS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://admin.yourdomain.com

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Worker Management
ENABLE_CLUSTERING=true
WORKER_MIN=2
WORKER_MAX=4
WORKER_MAX_MEMORY=512
WORKER_AUTO_SCALE=true
```

## Database Connection Pooling

The database configuration automatically manages connection pooling with:

- **Minimum connections**: 2 (configurable via `DB_POOL_MIN`)
- **Maximum connections**: 20 (configurable via `DB_POOL_MAX`)
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds
- **Automatic retry with exponential backoff**
- **Health monitoring every 60 seconds**

### Usage in Code

```typescript
import { getDatabasePool } from './utils/database-config'

// Get pool instance
const pool = getDatabasePool()

// Check pool health
const isHealthy = await pool.isPoolHealthy()

// Get pool statistics
const stats = pool.getPoolStats()
console.log(`Active connections: ${stats.totalCount}`)
console.log(`Idle connections: ${stats.idleCount}`)
```

## Health Monitoring

Three health check endpoints are available:

### 1. Comprehensive Health Check
**Endpoint**: `GET /health` or `GET /healthz`

Returns detailed system health including:
- Database connectivity
- Redis connectivity (if configured)
- Memory usage
- CPU usage
- Process information

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 5.2,
      "details": {
        "pool": {
          "total": 5,
          "idle": 3,
          "waiting": 0
        }
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2.1
    },
    "memory": {
      "status": "healthy",
      "details": {
        "system": {
          "total": 16384000000,
          "used": 8192000000,
          "percentage": 50
        }
      }
    }
  }
}
```

### 2. Liveness Probe
**Endpoint**: `GET /live` or `GET /livez`

Simple check to verify the service is alive. Used by Kubernetes.

### 3. Readiness Probe
**Endpoint**: `GET /ready` or `GET /readyz`

Checks if the service is ready to handle requests. Used by Kubernetes.

## Worker Management

Enable clustering for better performance and memory management:

```bash
yarn start:cluster
```

Features:
- **Automatic memory monitoring**: Workers restart when exceeding memory threshold
- **Auto-scaling**: Scale workers based on load (if enabled)
- **Graceful shutdown**: Workers complete current requests before stopping
- **Health monitoring**: Unresponsive workers are automatically restarted
- **Event logging**: All worker events are logged for monitoring

### Configuration

```env
ENABLE_CLUSTERING=true      # Enable worker clustering
WORKER_MIN=2               # Minimum number of workers
WORKER_MAX=4               # Maximum number of workers
WORKER_MAX_MEMORY=512      # Max memory per worker (MB)
WORKER_AUTO_SCALE=true     # Enable auto-scaling
```

## CORS Configuration

CORS is automatically configured based on route type:

- `/store/*` routes use `STORE_CORS` origins
- `/admin/*` routes use `ADMIN_CORS` origins
- `/auth/*` routes use `AUTH_CORS` origins

### Advanced CORS Options

```typescript
// Custom CORS configuration
import { createCorsMiddleware } from './api/middlewares/cors'

app.use(createCorsMiddleware({
  storeCors: 'https://store.example.com',
  adminCors: 'https://admin.example.com',
  credentials: true,
  maxAge: 86400,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit']
}))
```

### Wildcard Subdomain Support

```env
STORE_CORS=https://*.yourdomain.com
```

## Stripe Webhooks

Stripe webhooks are automatically secured with:

- **Signature verification**: All webhooks are verified using Stripe's signature
- **Idempotency**: Duplicate events are automatically ignored
- **Event routing**: Events are routed to appropriate handlers
- **Error handling**: Failed handlers don't block webhook acknowledgment

### Webhook Endpoint

**Endpoint**: `POST /webhooks/stripe`

### Supported Events

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`
- `charge.refunded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Custom Event Handlers

```typescript
import { registerWebhookHandler } from './api/webhooks/stripe'

// Register custom handler
registerWebhookHandler('custom.event', async (event, req) => {
  console.log('Custom event received:', event)
  // Your custom logic here
})
```

## Redis Caching

Redis integration provides:

- **Automatic reconnection**: With exponential backoff
- **Connection pooling**: For optimal performance
- **Health monitoring**: Regular ping checks
- **Namespace support**: Prevent key collisions
- **Cache-aside pattern**: Built-in get-or-set functionality

### Usage

```typescript
import { getRedisCache } from './utils/redis-config'

// Get cache instance
const cache = getRedisCache('products', 3600) // namespace, default TTL

// Basic operations
await cache.set('product:123', productData, 7200) // key, value, TTL
const product = await cache.get('product:123')
await cache.delete('product:123')

// Cache-aside pattern
const product = await cache.getOrSet('product:123', async () => {
  // This function is called only if key doesn't exist
  return await fetchProductFromDatabase(123)
}, 3600)
```

## Production Deployment

### 1. Build the Application

```bash
yarn build
```

### 2. Run Production Mode

Standard production mode:
```bash
NODE_ENV=production yarn start
```

With clustering enabled:
```bash
yarn start:cluster
```

### 3. Docker Deployment

The included Dockerfile is optimized for production with:
- Multi-stage build for smaller image size
- Non-root user for security
- Health checks included
- Proper signal handling

Build and run:
```bash
docker build -t indecisive-wear-backend .
docker run -p 9000:9000 --env-file .env.production indecisive-wear-backend
```

### 4. Process Management with PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'medusa-backend',
    script: './dist/src/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '512M',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
```

### 5. Monitoring

Monitor application health:

```bash
# Check health endpoint
curl http://localhost:9000/health

# Monitor logs
pm2 logs medusa-backend

# Monitor metrics
pm2 monit
```

### 6. Graceful Shutdown

The application handles graceful shutdown automatically:

1. Receives SIGTERM/SIGINT signal
2. Stops accepting new requests
3. Waits for active requests to complete (30s timeout)
4. Closes database connections
5. Closes Redis connections
6. Exits cleanly

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **CORS**: Configure specific origins, avoid wildcards in production
3. **Database**: Always use SSL connections in production
4. **Secrets**: Use strong secrets (minimum 32 characters) for JWT and cookies
5. **Headers**: Consider adding security headers middleware
6. **Rate Limiting**: Implement rate limiting for public endpoints
7. **Monitoring**: Set up alerts for health check failures

## Troubleshooting

### Database Connection Issues

1. Check `DATABASE_URL` format
2. Verify network connectivity
3. Check pool statistics at `/health` endpoint
4. Review logs for connection errors

### Memory Issues

1. Monitor worker memory usage
2. Adjust `WORKER_MAX_MEMORY` if needed
3. Check for memory leaks in custom code
4. Review heap dumps if necessary

### Redis Connection Issues

1. Verify `REDIS_URL` format
2. Check Redis server is running
3. Review connection logs
4. Test with `redis-cli`

### Webhook Issues

1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook signature in Stripe dashboard
3. Review webhook event logs
4. Test with Stripe CLI

## Performance Optimization

1. **Database Queries**: Use indexes and optimize queries
2. **Caching**: Cache frequently accessed data in Redis
3. **Connection Pooling**: Adjust pool size based on load
4. **Worker Scaling**: Enable auto-scaling for variable load
5. **CDN**: Serve static assets through CDN
6. **Compression**: Enable gzip compression
7. **Query Optimization**: Use database query analysis tools