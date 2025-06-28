# Common Error Scenarios and Solutions

This document outlines common error scenarios you might encounter during deployment and how to handle them.

## 1. Database Connection Errors

### Error: `ECONNREFUSED 127.0.0.1:5432`

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete]
```

**Causes:**
- PostgreSQL is not running
- Wrong connection string
- Docker network issues

**Solutions:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs --tail=50 postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection string
echo $DATABASE_URL

# Test connection manually
docker exec -it postgres psql -U postgres -d medusa-db -c "SELECT 1;"
```

### Error: `too many connections`

**Symptoms:**
```
error: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**
```bash
# Check current connections
docker exec -it postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
docker exec -it postgres psql -U postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '10 minutes';"

# Increase max connections (requires restart)
docker exec -it postgres psql -U postgres -c "ALTER SYSTEM SET max_connections = 200;"
docker-compose restart postgres
```

## 2. Redis Connection Errors

### Error: `Redis connection to localhost:6379 failed`

**Symptoms:**
```
Error: Redis connection to localhost:6379 failed - connect ECONNREFUSED
```

**Solutions:**
```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker exec -it redis redis-cli ping

# Check Redis memory
docker exec -it redis redis-cli INFO memory

# Clear Redis if needed
docker exec -it redis redis-cli FLUSHALL

# Restart Redis
docker-compose restart redis
```

### Error: `OOM command not allowed when used memory > 'maxmemory'`

**Solutions:**
```bash
# Check memory usage
docker exec -it redis redis-cli INFO memory | grep used_memory_human

# Set memory policy
docker exec -it redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Increase memory limit
docker-compose down
# Edit docker-compose.yml to add: command: redis-server --maxmemory 512mb
docker-compose up -d
```

## 3. API/Backend Errors

### Error: `Cannot find module`

**Symptoms:**
```
Error: Cannot find module '@medusajs/medusa'
```

**Solutions:**
```bash
cd backend

# Clear node_modules and reinstall
rm -rf node_modules
rm -rf yarn.lock
yarn install

# Clear build cache
rm -rf dist/
yarn build

# Restart backend
docker-compose restart medusa
```

### Error: `Port 9000 already in use`

**Solutions:**
```bash
# Find process using port
lsof -i :9000

# Kill process
kill -9 <PID>

# Or use different port
export PORT=9001
docker-compose up -d
```

## 4. Frontend Build Errors

### Error: `JavaScript heap out of memory`

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Build with increased memory
pnpm build

# Or modify package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

### Error: `Module not found: Can't resolve`

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
rm -rf pnpm-lock.yaml

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

## 5. Docker Errors

### Error: `Cannot connect to the Docker daemon`

**Solutions:**
```bash
# Check Docker service
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Error: `No space left on device`

**Solutions:**
```bash
# Check disk space
df -h

# Clean Docker system
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove stopped containers
docker container prune
```

## 6. Migration Errors

### Error: `Migration failed`

**Symptoms:**
```
Error: Migration 20240101000000_add_table failed
```

**Solutions:**
```bash
# Check migration status
cd backend
yarn medusa migrations:show

# Rollback last migration
yarn medusa migrations:revert

# Run migrations again
yarn medusa db:migrate

# Force sync (development only)
yarn medusa db:sync
```

## 7. Performance Issues

### Symptom: Slow API responses

**Diagnosis:**
```bash
# Check container resources
docker stats

# Check database queries
docker exec -it postgres psql -U postgres -d medusa-db -c "
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

**Solutions:**
```bash
# Add database indexes
docker exec -it postgres psql -U postgres -d medusa-db -c "
CREATE INDEX idx_product_handle ON product(handle);
CREATE INDEX idx_cart_customer ON cart(customer_id);
CREATE INDEX idx_order_status ON \"order\"(status);"

# Increase container resources
# Edit docker-compose.yml:
services:
  medusa:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 8. SSL/TLS Errors

### Error: `certificate verify failed`

**Solutions:**
```bash
# For development, disable SSL verification
export NODE_TLS_REJECT_UNAUTHORIZED=0

# For production, add proper certificates
# Copy certificates to backend/certs/
cp /path/to/cert.pem backend/certs/
cp /path/to/key.pem backend/certs/

# Update configuration
export SSL_CERT_PATH=./certs/cert.pem
export SSL_KEY_PATH=./certs/key.pem
```

## 9. Environment Variable Errors

### Error: `Missing required environment variable`

**Quick Check Script:**
```bash
#!/bin/bash
# check-env.sh

REQUIRED_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET"
  "COOKIE_SECRET"
  "STORE_CORS"
)

MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set"
else
  echo "❌ Missing environment variables:"
  printf '%s\n' "${MISSING[@]}"
  exit 1
fi
```

## 10. Monitoring Alert Responses

### High Memory Usage Alert

```bash
# Identify memory-hungry processes
docker exec -it medusa ps aux --sort=-%mem | head

# Check for memory leaks
docker exec -it medusa cat /proc/meminfo

# Restart container if needed
docker-compose restart medusa
```

### High CPU Usage Alert

```bash
# Identify CPU-intensive processes
docker exec -it medusa top -b -n 1 | head -20

# Check for infinite loops or heavy queries
docker logs --tail=100 medusa | grep ERROR

# Scale horizontally if needed
docker-compose up -d --scale medusa=2
```

## Emergency Recovery Script

Save as `emergency-recovery.sh`:

```bash
#!/bin/bash

echo "🚨 Starting emergency recovery..."

# Stop all services
docker-compose down

# Backup current state
mkdir -p backups
docker exec postgres pg_dump -U postgres medusa-db > backups/emergency-backup-$(date +%Y%m%d-%H%M%S).sql

# Clear problematic data
docker volume rm $(docker volume ls -q | grep medusa)

# Restart with fresh state
docker-compose up -d postgres redis
sleep 10

# Restore from backup
docker exec -i postgres psql -U postgres -d medusa-db < backups/latest-good-backup.sql

# Start services
docker-compose up -d

echo "✅ Emergency recovery complete"
```

Remember: Always check logs first before taking drastic actions!

```bash
# Quick log check
docker-compose logs --tail=100 medusa | grep -E "ERROR|FATAL|CRITICAL"
```