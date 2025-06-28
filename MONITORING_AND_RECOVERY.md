# 🔍 Monitoring & Error Recovery Strategy

## 1. Free Monitoring Stack

### 1.1 UptimeRobot (Free Tier)
```bash
# Monitor these endpoints:
https://api.yourdomain.com/health          # Every 5 minutes
https://api.yourdomain.com/store/products  # Every 15 minutes
https://yourdomain.com                     # Every 5 minutes
```

### 1.2 Railway/Render Built-in Metrics
- CPU Usage
- Memory Usage
- Request Count
- Response Time

### 1.3 Custom Health Dashboard

Create `app/status/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'

interface HealthStatus {
  backend: 'healthy' | 'unhealthy' | 'unknown'
  database: 'healthy' | 'unhealthy' | 'unknown'
  redis: 'healthy' | 'unhealthy' | 'unknown'
  stripe: 'configured' | 'not configured' | 'unknown'
}

export default function StatusPage() {
  const [status, setStatus] = useState<HealthStatus>({
    backend: 'unknown',
    database: 'unknown',
    redis: 'unknown',
    stripe: 'unknown'
  })

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/health`)
        const data = await res.json()
        
        setStatus({
          backend: data.status,
          database: data.checks?.database?.status || 'unknown',
          redis: data.checks?.redis?.status || 'unknown',
          stripe: 'unknown' // Check separately
        })
      } catch (error) {
        setStatus(prev => ({ ...prev, backend: 'unhealthy' }))
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'configured': return 'bg-green-500'
      case 'unhealthy': return 'bg-red-500'
      case 'not configured': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">System Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(status).map(([service, serviceStatus]) => (
          <div key={service} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold capitalize">{service}</h2>
              <div className={`w-4 h-4 rounded-full ${getStatusColor(serviceStatus)}`} />
            </div>
            <p className="text-gray-600 mt-2 capitalize">{serviceStatus}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 2. Error Recovery Procedures

### 2.1 Automatic Recovery Script

Create `scripts/auto-recovery.sh`:
```bash
#!/bin/bash

# Auto-recovery script for common issues
BACKEND_URL=${1:-"https://api.yourdomain.com"}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

send_alert() {
    local message=$1
    echo "🚨 ALERT: $message"
    
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Production Alert: $message\"}" \
            $SLACK_WEBHOOK
    fi
}

check_and_recover() {
    # Check health
    HEALTH=$(curl -s $BACKEND_URL/health || echo "{}")
    STATUS=$(echo $HEALTH | jq -r '.status' || echo "unknown")
    
    if [ "$STATUS" != "healthy" ]; then
        send_alert "Backend unhealthy. Attempting recovery..."
        
        # Check specific issues
        DB_STATUS=$(echo $HEALTH | jq -r '.checks.database.status' || echo "unknown")
        REDIS_STATUS=$(echo $HEALTH | jq -r '.checks.redis.status' || echo "unknown")
        
        # Database connection issues
        if [ "$DB_STATUS" = "unhealthy" ]; then
            send_alert "Database connection failed. Restarting service..."
            railway restart || render restart medusa-backend
            sleep 30
        fi
        
        # Redis connection issues
        if [ "$REDIS_STATUS" = "unhealthy" ]; then
            send_alert "Redis connection failed. Checking Redis URL..."
            # This would need manual intervention
            send_alert "Please check REDIS_URL includes ?family=0"
        fi
        
        # Memory issues
        MEMORY=$(echo $HEALTH | jq -r '.checks.memory.heapUsed' || echo "0MB")
        MEMORY_MB=${MEMORY%MB}
        if [ "$MEMORY_MB" -gt "1500" ]; then
            send_alert "High memory usage detected ($MEMORY). Restarting..."
            railway restart || render restart medusa-backend
        fi
    fi
}

# Run checks every 5 minutes
while true; do
    check_and_recover
    sleep 300
done
```

### 2.2 Manual Recovery Procedures

#### Database Connection Pool Exhausted
```bash
# 1. Immediate fix - restart service
railway restart
# or
render restart medusa-backend

# 2. Long-term fix - update pool configuration
railway variables set DATABASE_POOL_MAX=20
railway up
```

#### Redis Connection Failed
```bash
# 1. Check Redis URL format
railway variables get REDIS_URL
# Must end with ?family=0

# 2. Fix if needed
railway variables set REDIS_URL="${REDIS_URL}?family=0"
railway up
```

#### Admin Panel Not Loading
```bash
# 1. Check build
railway logs | grep -i admin

# 2. Rebuild admin
railway run yarn build:admin
railway up
```

#### Worker Crashed
```bash
# 1. Check worker logs
railway logs medusa-worker --tail

# 2. Restart worker
railway restart medusa-worker

# 3. If persistent, redeploy
railway up --service medusa-worker
```

## 3. Monitoring Alerts

### 3.1 Critical Alerts (Immediate Action)
- Backend returns 5xx errors
- Database connection lost
- Payment webhook failures
- Memory usage > 90%
- Response time > 5 seconds

### 3.2 Warning Alerts (Action Within 1 Hour)
- Memory usage > 70%
- Response time > 3 seconds
- Redis connection intermittent
- High error rate (>1%)

### 3.3 Info Alerts (Monitor)
- New deployment completed
- Backup completed
- High traffic detected

## 4. Performance Monitoring

### 4.1 Custom Metrics Endpoint

Create `backend/src/api/metrics/route.ts`:
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

let requestCount = 0;
let errorCount = 0;
const responseTime: number[] = [];

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const metrics = {
    uptime: `${Math.floor(uptime / 60)} minutes`,
    requests: {
      total: requestCount,
      errors: errorCount,
      errorRate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) + '%' : '0%'
    },
    performance: {
      avgResponseTime: responseTime.length > 0 
        ? (responseTime.reduce((a, b) => a + b, 0) / responseTime.length).toFixed(2) + 'ms'
        : '0ms',
      memoryUsage: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
      }
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage()
    }
  };
  
  res.json(metrics);
};

// Middleware to track metrics
export function trackMetrics(req: any, res: any, next: any) {
  requestCount++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    responseTime.push(duration);
    
    // Keep only last 100 response times
    if (responseTime.length > 100) {
      responseTime.shift();
    }
    
    if (res.statusCode >= 400) {
      errorCount++;
    }
  });
  
  next();
}
```

### 4.2 Grafana Cloud (Free Tier)
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 5. Disaster Recovery

### 5.1 Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Database backup
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to S3/Supabase
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### 5.2 Recovery Plan
1. **Database Corruption**
   ```bash
   # Restore from backup
   railway run psql $DATABASE_URL < backup-20240101.sql
   ```

2. **Complete Service Failure**
   ```bash
   # Quick redeploy
   git checkout last-known-good
   railway up --force
   ```

3. **Regional Outage**
   - Have backup deployment ready on different provider
   - Update DNS to point to backup

## 6. Monitoring Checklist

### Daily
- [ ] Check health endpoint
- [ ] Review error logs
- [ ] Monitor response times
- [ ] Check memory usage

### Weekly
- [ ] Review performance metrics
- [ ] Test backup restoration
- [ ] Update dependencies
- [ ] Review security alerts

### Monthly
- [ ] Full disaster recovery drill
- [ ] Performance optimization review
- [ ] Cost analysis
- [ ] Security audit

## 7. Emergency Contacts

Keep these readily available:
```yaml
# .emergency-contacts.yml
services:
  railway:
    support: support@railway.app
    status: https://status.railway.app
    
  render:
    support: support@render.com
    status: https://status.render.com
    
  stripe:
    support: https://support.stripe.com
    status: https://status.stripe.com
    
  supabase:
    support: support@supabase.io
    status: https://status.supabase.com

team:
  on_call_primary: "+1-xxx-xxx-xxxx"
  on_call_secondary: "+1-xxx-xxx-xxxx"
  escalation: "manager@company.com"
```

## 8. Runbook for Common Issues

### Issue: High Memory Usage
1. Check metrics endpoint
2. Identify memory leak source
3. Restart affected service
4. Monitor for recurrence
5. If persistent, check for:
   - Unbounded arrays
   - Event listener leaks
   - Large file processing

### Issue: Slow Response Times
1. Check database query performance
2. Review Redis cache hit rate
3. Check for N+1 queries
4. Enable query logging
5. Optimize slow queries

### Issue: Payment Failures
1. Check Stripe webhook logs
2. Verify webhook secret
3. Test with Stripe CLI
4. Check for network issues
5. Review error messages

Remember: **Always test recovery procedures in staging first!**