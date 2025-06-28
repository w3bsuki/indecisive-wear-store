# 💰 Cost Optimization Guide

## 📊 Cost Breakdown by Deployment Option

### Option 1: Ultra-Budget ($0-5/month)
Perfect for MVP testing and development.

```
Frontend:       Vercel Free Tier        $0
Backend:        Render Free Tier        $0  
Database:       Supabase Free (Postgres) $0
Redis:          Upstash Free Tier       $0
File Storage:   Supabase Storage Free   $0
--------------------------------
Total:                                  $0/month
```

**Limitations:**
- Backend sleeps after 15 min
- 1GB database limit
- 10k Redis commands/day
- 1GB file storage

### Option 2: Production Starter ($15-25/month)
Best for small businesses and startups.

```
Frontend:       Vercel Free             $0
Backend:        Railway Hobby           $5 + usage (~$10)
Database:       Railway Postgres        Included
Redis:          Railway Redis           Included
Worker:         Railway Worker          $5
File Storage:   Supabase Free          $0
--------------------------------
Total:                                  $20/month
```

**Capabilities:**
- Always-on backend
- 10GB database
- Persistent Redis
- Background jobs
- ~50k monthly visits

### Option 3: Growth Stage ($50-100/month)
For growing businesses with real traffic.

```
Frontend:       Vercel Pro              $20
Backend:        Railway/Render Pro      $25
Database:       Managed Postgres        $25
Redis:          Dedicated Redis         $10
Worker:         Separate instance       $20
CDN:            Cloudflare Pro          $20
Monitoring:     Datadog/NewRelic        $0-30
--------------------------------
Total:                                  $100-150/month
```

## 🎯 Cost Optimization Strategies

### 1. Database Optimization

#### Use Connection Pooling
```typescript
// Reduces connection overhead
const poolConfig = {
  min: 2,  // Minimum connections
  max: 10, // Maximum connections (adjust based on plan)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

#### Implement Query Caching
```typescript
// Cache expensive queries
import { Redis } from '@medusajs/medusa/utils'

async function getCachedProducts() {
  const cacheKey = 'products:all'
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const products = await productService.list()
  await redis.set(cacheKey, JSON.stringify(products), 'EX', 3600) // 1 hour
  
  return products
}
```

#### Archive Old Data
```sql
-- Move old orders to archive table
CREATE TABLE orders_archive AS 
SELECT * FROM orders 
WHERE created_at < NOW() - INTERVAL '6 months';

DELETE FROM orders 
WHERE created_at < NOW() - INTERVAL '6 months';
```

### 2. Redis Optimization

#### Use Appropriate TTL
```typescript
// Don't cache forever
await redis.setex('session:123', 3600, userData)     // 1 hour
await redis.setex('product:456', 86400, productData) // 24 hours
await redis.setex('cart:789', 7200, cartData)        // 2 hours
```

#### Implement Redis Eviction Policy
```bash
# In Redis config
maxmemory 100mb
maxmemory-policy allkeys-lru
```

### 3. File Storage Optimization

#### Image Optimization Pipeline
```typescript
// Optimize images before storage
import sharp from 'sharp'

async function optimizeProductImage(file: Buffer) {
  const optimized = await sharp(file)
    .resize(1000, 1000, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: 85 })
    .toBuffer()
    
  // Can reduce file size by 60-80%
  return optimized
}
```

#### Use CDN for Static Assets
```typescript
// Serve images through CDN
const getImageUrl = (path: string) => {
  if (process.env.NODE_ENV === 'production') {
    return `https://cdn.yourdomain.com/${path}`
  }
  return `/uploads/${path}`
}
```

### 4. Compute Optimization

#### Implement Request Caching
```typescript
// Cache API responses
export function cacheMiddleware(duration = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.method}:${req.path}`
    const cached = await redis.get(key)
    
    if (cached) {
      return res.json(JSON.parse(cached))
    }
    
    // Store original send
    const originalSend = res.json
    res.json = function(data) {
      redis.setex(key, duration, JSON.stringify(data))
      return originalSend.call(this, data)
    }
    
    next()
  }
}
```

#### Use Serverless for Sporadic Tasks
```typescript
// Move heavy operations to edge functions
// Supabase Edge Function example
export async function generateReport(orderId: string) {
  // This runs on Supabase's infrastructure, not your server
  const order = await getOrder(orderId)
  const pdf = await generatePDF(order)
  return pdf
}
```

### 5. Monitoring Optimization

#### Free Monitoring Stack
```yaml
# Use free tiers effectively
monitoring:
  uptime: UptimeRobot Free      # 50 monitors
  logs: Logtail Free            # 1GB/month
  errors: Sentry Free           # 5k events/month
  analytics: Plausible Free     # Unlimited
  performance: GT Metrix Free   # Daily tests
```

### 6. Scaling Strategy

#### Start Small, Scale Smart
```bash
# Month 1-3: Minimum viable deployment
Railway Hobby + Supabase Free = $5-10/month

# Month 4-6: Add redundancy
+ Worker instance = $20/month

# Month 7-12: Optimize performance
+ CDN + Better monitoring = $50/month

# Year 2: Full production
Dedicated resources = $100-200/month
```

## 📈 When to Scale Up

### Database Signals
- [ ] Queries taking > 100ms consistently
- [ ] Connection pool exhaustion warnings
- [ ] Database size > 80% of limit
- [ ] Need for read replicas

### Redis Signals
- [ ] Cache evictions happening frequently
- [ ] Memory usage > 80%
- [ ] Command latency > 10ms

### Compute Signals
- [ ] Response time > 500ms (p95)
- [ ] Memory usage > 80% consistently  
- [ ] CPU usage > 70% consistently
- [ ] Error rate > 1%

## 💡 Money-Saving Tips

### 1. Use Spot/Preemptible Instances
```bash
# 70% cheaper for non-critical workloads
# Good for: Workers, staging environments
# Bad for: Production API, databases
```

### 2. Implement Auto-Scaling
```typescript
// Scale workers based on queue size
if (queueSize > 1000) {
  scaleWorkers(3)
} else if (queueSize < 100) {
  scaleWorkers(1)
}
```

### 3. Regional Deployment
```yaml
# Deploy closest to your users
us-east: Primary (60% traffic)
eu-west: Replica (30% traffic)
ap-south: CDN only (10% traffic)
```

### 4. Batch Operations
```typescript
// Instead of 1000 individual inserts
for (const item of items) {
  await db.insert(item) // Bad: 1000 queries
}

// Do this
await db.batchInsert(items) // Good: 1 query
```

### 5. Clean Up Regularly
```bash
#!/bin/bash
# cleanup.sh - Run monthly

# Remove old logs
find ./logs -type f -mtime +30 -delete

# Clean docker images
docker system prune -af

# Archive old backups
aws s3 sync ./backups s3://archive-bucket/ --delete

# Remove unused dependencies
yarn autoclean --force
```

## 🎯 Cost Monitoring Script

Create `scripts/cost-monitor.sh`:
```bash
#!/bin/bash

# Monitor resource usage and estimate costs

echo "💰 Cost Analysis Report"
echo "======================"

# Railway costs
if command -v railway &> /dev/null; then
    echo "Railway Usage:"
    railway usage
fi

# Database size
DB_SIZE=$(psql $DATABASE_URL -t -c "SELECT pg_database_size(current_database())/1024/1024 as size_mb;")
echo "Database Size: ${DB_SIZE}MB"

# Redis memory
REDIS_INFO=$(redis-cli -u $REDIS_URL info memory | grep used_memory_human | cut -d: -f2)
echo "Redis Memory: $REDIS_INFO"

# Estimate monthly cost
if [ "$DB_SIZE" -lt "1000" ]; then
    EST_COST=20
elif [ "$DB_SIZE" -lt "10000" ]; then
    EST_COST=50
else
    EST_COST=100
fi

echo ""
echo "Estimated Monthly Cost: \$${EST_COST}"
echo ""
echo "Optimization Suggestions:"

if [ "$DB_SIZE" -gt "5000" ]; then
    echo "- Consider archiving old orders"
fi

if [[ "$REDIS_INFO" == *"GB"* ]]; then
    echo "- Redis memory high, review cache TTLs"
fi
```

## 📊 ROI Calculation

```
Initial Setup Cost: $50-100 (developer time)
Monthly Running Cost: $20-100

Break-even Analysis:
- If you process 100 orders/month at $50 average = $5000 revenue
- Platform cost is 0.4-2% of revenue
- Highly profitable at scale

Compare to:
- Shopify: $29-299/month + 2.9% transaction fees
- WooCommerce: $20-100/month hosting + maintenance
- Custom solution: $500-2000/month
```

## 🚀 Final Recommendations

1. **Start with Railway Hobby ($5)** - Best value for startups
2. **Use Supabase Free Tier** - Generous limits for files/auth
3. **Implement caching early** - Reduces database load by 80%
4. **Monitor from day 1** - Catch issues before they cost money
5. **Archive aggressively** - Keep active dataset small
6. **Use CDN for images** - Cloudflare free tier is excellent

Remember: **Premature optimization is expensive. Scale when you have revenue!**