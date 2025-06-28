# Rollback Procedures

This document outlines the rollback procedures for each critical fix in case of deployment failure.

## General Rollback Strategy

1. **Immediate Actions**:
   - Stop all running services
   - Preserve logs for debugging
   - Notify team of rollback initiation

2. **Rollback Order**:
   - Always rollback in reverse order of deployment
   - Test each rollback step before proceeding

## Fix-Specific Rollback Procedures

### 1. Database Connection Fix Rollback

**Symptoms of Failure**:
- Connection pool exhaustion errors
- Database timeout errors
- `ECONNREFUSED` errors

**Rollback Steps**:
```bash
# 1. Stop the backend service
docker-compose stop medusa

# 2. Restore previous database configuration
cd backend
git checkout HEAD -- medusa-config.ts
git checkout HEAD -- medusa-config.production.ts

# 3. Clear any stuck connections
docker exec -it postgres psql -U postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'medusa-db'
AND pid <> pg_backend_pid();"

# 4. Restart with previous configuration
docker-compose up -d medusa

# 5. Verify rollback
curl -f http://localhost:9000/health || echo "Health check failed"
```

### 2. Redis Configuration Rollback

**Symptoms of Failure**:
- Redis connection errors
- Session management failures
- Cart persistence issues

**Rollback Steps**:
```bash
# 1. Stop services using Redis
docker-compose stop medusa

# 2. Clear Redis data if corrupted
docker exec -it redis redis-cli FLUSHALL

# 3. Restore Redis configuration
cd backend
git checkout HEAD -- src/services/redis.ts

# 4. Restart services
docker-compose up -d redis
sleep 5
docker-compose up -d medusa

# 5. Test Redis connectivity
docker exec -it redis redis-cli ping
```

### 3. Monitoring Endpoint Rollback

**Symptoms of Failure**:
- 500 errors on /monitoring endpoint
- Health check failures
- Prometheus scraping errors

**Rollback Steps**:
```bash
# 1. Remove monitoring endpoint
cd backend
rm -f src/api/monitoring/route.ts

# 2. Update route configuration
git checkout HEAD -- src/api/index.ts

# 3. Rebuild and restart
yarn build
docker-compose restart medusa

# 4. Verify removal
curl -I http://localhost:9000/monitoring | grep "404"
```

### 4. Security Headers Rollback

**Symptoms of Failure**:
- CORS errors in frontend
- Authentication failures
- API access issues

**Rollback Steps**:
```bash
# 1. Restore middleware configuration
cd backend
git checkout HEAD -- src/api/middlewares/

# 2. Clear browser caches (notify users)
# Users may need to clear browser cache

# 3. Restart backend
docker-compose restart medusa

# 4. Test CORS
curl -H "Origin: http://localhost:3000" \
     -I http://localhost:9000/store/products
```

### 5. Performance Optimizations Rollback

**Symptoms of Failure**:
- Increased response times
- Memory leaks
- CPU spikes

**Rollback Steps**:
```bash
# 1. Restore previous configurations
cd backend
git checkout HEAD -- src/api/
git checkout HEAD -- src/modules/

# 2. Reset environment variables
export NODE_OPTIONS=""
unset MEDUSA_WORKER_MODE

# 3. Restart with default settings
docker-compose down
docker-compose up -d

# 4. Monitor performance
docker stats --no-stream
```

## Emergency Full Rollback

If multiple fixes are causing issues:

```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 Starting emergency rollback..."

# 1. Stop everything
docker-compose down

# 2. Checkout last known good commit
LAST_GOOD_COMMIT=${1:-"HEAD~1"}
git checkout $LAST_GOOD_COMMIT

# 3. Clean build artifacts
cd backend
rm -rf dist/
rm -rf node_modules/.cache/
cd ..

# 4. Rebuild everything
cd backend
yarn install
yarn build
cd ..

# 5. Start services one by one
docker-compose up -d postgres redis
sleep 10
docker-compose up -d medusa
sleep 30
docker-compose up -d

# 6. Verify system health
./testing/verification-scripts/verify-health.sh

echo "✅ Emergency rollback complete"
```

## Post-Rollback Checklist

After any rollback:

1. **Verify System Health**:
   ```bash
   curl http://localhost:9000/health
   curl http://localhost:3000
   ```

2. **Check Logs**:
   ```bash
   docker-compose logs --tail=100 medusa
   docker-compose logs --tail=100 postgres
   ```

3. **Test Critical Functions**:
   - Can create cart
   - Can view products
   - Can add to cart
   - Authentication works

4. **Monitor for 30 minutes**:
   ```bash
   watch -n 5 'docker stats --no-stream'
   ```

5. **Document Issues**:
   - What failed?
   - Error messages
   - Time of failure
   - Actions taken

## Rollback Decision Matrix

| Symptom | Severity | Action | Rollback Priority |
|---------|----------|--------|-------------------|
| Database connection errors | Critical | Immediate rollback | 1 |
| 500 errors on all endpoints | Critical | Immediate rollback | 1 |
| Memory leak (>2GB) | Critical | Immediate rollback | 1 |
| Slow API responses (>5s) | High | Monitor, then rollback | 2 |
| Missing security headers | Medium | Fix forward if possible | 3 |
| Minor UI issues | Low | Fix forward | 4 |

## Communication Template

When initiating rollback:

```
Subject: [ROLLBACK] Deployment Issue - [Component Name]

Status: Rollback In Progress
Component: [Database/Redis/API/Frontend]
Issue: [Brief description]
Impact: [User impact description]
ETA: [Estimated completion time]

Actions Taken:
1. [Action 1]
2. [Action 2]

Next Steps:
- [Next step 1]
- [Next step 2]
```

## Rollback Verification Script

Save as `verify-rollback.sh`:

```bash
#!/bin/bash

echo "🔍 Verifying rollback..."

# Check all services
SERVICES=("postgres" "redis" "medusa")
for service in "${SERVICES[@]}"; do
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is NOT running"
        exit 1
    fi
done

# Check endpoints
ENDPOINTS=(
    "http://localhost:9000/health"
    "http://localhost:3000"
    "http://localhost:9000/store/products"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "$endpoint" > /dev/null; then
        echo "✅ $endpoint is accessible"
    else
        echo "❌ $endpoint is NOT accessible"
    fi
done

echo "✅ Rollback verification complete"
```

Remember: **Always prefer fixing forward when possible, but don't hesitate to rollback if user experience is significantly impacted.**