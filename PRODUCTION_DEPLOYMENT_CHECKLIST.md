# 🚀 Production Deployment Checklist

## Pre-Deployment Phase

### 1. Code Preparation ✓
- [ ] Fix admin panel issue (apply SWC fix from FIX_ADMIN_PANEL.md)
- [ ] Remove all console.logs and debug code
- [ ] Update all API endpoints to use environment variables
- [ ] Ensure no hardcoded secrets in codebase
- [ ] Run linting and fix all errors: `cd backend && yarn lint`
- [ ] Run type checking: `yarn typecheck`
- [ ] Update dependencies to stable versions
- [ ] Test build locally: `yarn build`

### 2. Database Setup ✓
- [ ] Create production PostgreSQL database
- [ ] Enable SSL on database
- [ ] Set up connection pooling (max 20 connections)
- [ ] Create database backup strategy
- [ ] Run initial migrations: `yarn medusa db:migrate`
- [ ] Verify database schema is correct
- [ ] Set up read replica if needed

### 3. Redis Configuration ✓
- [ ] Provision Redis instance (Railway/Render/Upstash)
- [ ] Configure persistence (AOF or RDB)
- [ ] Set maxmemory policy to 'allkeys-lru'
- [ ] Test connection with ?family=0 suffix
- [ ] Configure Redis password
- [ ] Set up Redis monitoring

### 4. Environment Variables ✓
- [ ] Generate all secret keys (JWT_SECRET, COOKIE_SECRET)
- [ ] Set up all backend env vars (see ENVIRONMENT_VARIABLES_COMPLETE.md)
- [ ] Set up all frontend env vars
- [ ] Validate no missing variables
- [ ] Store secrets in platform secret manager
- [ ] Document all custom env vars

### 5. Third-Party Services ✓

#### Stripe Setup
- [ ] Switch to live API keys
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Add webhook signing secret to env vars
- [ ] Enable all required payment methods
- [ ] Set up fraud prevention rules
- [ ] Configure tax settings
- [ ] Test webhook endpoint connectivity
- [ ] Set up Stripe CLI for monitoring

#### Supabase Setup
- [ ] Create production Supabase project
- [ ] Set up authentication providers
- [ ] Configure Row Level Security policies
- [ ] Create storage buckets with proper permissions
- [ ] Set up database tables for social features
- [ ] Configure edge functions if needed
- [ ] Set CORS allowed origins
- [ ] Enable point-in-time recovery

## Deployment Phase

### 6. Backend Deployment (Railway) ✓
```bash
# Step-by-step commands
cd backend
git add .
git commit -m "Prepare for production deployment"

# Railway deployment
railway login
railway init
railway add postgresql
railway add redis
railway variables import < .env.production
railway up

# Verify deployment
railway logs --tail
railway open
```

### 7. Backend Deployment (Render) ✓
```bash
# Alternative Render deployment
cd backend
git push origin main

# In Render Dashboard
1. New > Blueprint
2. Connect GitHub repo
3. Use render.yaml
4. Add environment variables
5. Deploy

# Verify
render logs --tail medusa-api
```

### 8. Worker Service Deployment ✓
- [ ] Create separate worker service instance
- [ ] Set MEDUSA_WORKER_MODE=worker
- [ ] Set DISABLE_MEDUSA_ADMIN=true
- [ ] Use same DATABASE_URL and REDIS_URL
- [ ] Deploy worker service
- [ ] Verify worker is processing jobs

### 9. Frontend Deployment (Vercel) ✓
```bash
# Vercel deployment
cd .. # root directory
vercel --prod

# Set environment variables
vercel env pull
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
# Add all other env vars

# Redeploy with env vars
vercel --prod --force
```

### 10. Domain Configuration ✓
- [ ] Set up custom domain for backend (api.yourdomain.com)
- [ ] Configure SSL certificates (auto on Railway/Render)
- [ ] Set up custom domain for frontend (yourdomain.com)
- [ ] Update CORS settings with production domains
- [ ] Configure DNS records
- [ ] Set up www redirect

## Post-Deployment Phase

### 11. Verification Checklist ✓
- [ ] Admin panel accessible: https://api.yourdomain.com/admin
- [ ] API health check passing: https://api.yourdomain.com/health
- [ ] Frontend loading properly: https://yourdomain.com
- [ ] Products displaying correctly
- [ ] Cart functionality working
- [ ] Search functionality working
- [ ] Authentication flow working
- [ ] Payment flow working (test mode first)
- [ ] Email notifications sending
- [ ] File uploads working
- [ ] Worker processing background jobs

### 12. Stripe Production Testing ✓
- [ ] Create test order with test card: 4242 4242 4242 4242
- [ ] Verify webhook received
- [ ] Check order status updated
- [ ] Verify email sent
- [ ] Test refund flow
- [ ] Switch to live mode
- [ ] Make real purchase with small amount
- [ ] Verify funds received

### 13. Monitoring Setup ✓
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up log aggregation
- [ ] Create performance monitoring dashboards
- [ ] Configure alerts for:
  - [ ] High error rate
  - [ ] Slow response times
  - [ ] Database connection issues
  - [ ] Payment failures
  - [ ] Low inventory
- [ ] Set up backup monitoring

### 14. Security Hardening ✓
- [ ] Enable rate limiting on API
- [ ] Configure security headers
- [ ] Set up DDoS protection (Cloudflare)
- [ ] Implement request validation
- [ ] Enable audit logging
- [ ] Configure backup encryption
- [ ] Set up security scanning
- [ ] Create incident response plan

### 15. Performance Optimization ✓
- [ ] Enable CDN for static assets
- [ ] Configure image optimization
- [ ] Set up database query optimization
- [ ] Enable response caching
- [ ] Configure compression
- [ ] Optimize bundle size
- [ ] Set up lazy loading
- [ ] Enable HTTP/2

### 16. Backup & Recovery ✓
- [ ] Set up automated database backups
- [ ] Test backup restoration process
- [ ] Document recovery procedures
- [ ] Set up file storage backups
- [ ] Create disaster recovery plan
- [ ] Test failover procedures

### 17. Documentation ✓
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] Create API documentation
- [ ] Document third-party integrations
- [ ] Create troubleshooting guide

## Go-Live Checklist

### Final Steps Before Launch ✓
- [ ] Remove all test data
- [ ] Seed production database with real products
- [ ] Double-check all payment settings
- [ ] Verify email templates
- [ ] Test complete user journey
- [ ] Load test the application
- [ ] Review security checklist
- [ ] Prepare customer support

### Launch Day ✓
- [ ] Monitor all services closely
- [ ] Watch error logs
- [ ] Monitor payment processing
- [ ] Check performance metrics
- [ ] Be ready to rollback if needed
- [ ] Communicate with team
- [ ] Celebrate! 🎉

## Rollback Plan

If issues arise:
1. [ ] Switch frontend to maintenance mode
2. [ ] Identify the issue from logs
3. [ ] If critical: Rollback deployment
4. [ ] Fix issue in staging
5. [ ] Re-deploy when resolved
6. [ ] Document incident

## Common Issues & Solutions

### Admin Panel Not Loading
```bash
# Check SWC version
cd backend && grep "@swc/core" yarn.lock
# Should be 1.11.21, not 1.11.22

# Rebuild
rm -rf node_modules yarn.lock
yarn install
yarn build
```

### Worker Not Processing
```bash
# Check Redis URL
echo $REDIS_URL  # Must have ?family=0

# Check worker logs
railway logs medusa-worker --tail
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check SSL setting
DATABASE_EXTRA='{"ssl":{"rejectUnauthorized":false}}'
```

### Payment Webhooks Failing
```bash
# Test with Stripe CLI
stripe listen --forward-to https://api.yourdomain.com/api/hooks/payment/stripe

# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET
```

## Success Metrics

Monitor these KPIs post-launch:
- [ ] Page load time < 3 seconds
- [ ] API response time < 200ms
- [ ] Error rate < 1%
- [ ] Uptime > 99.9%
- [ ] Successful payment rate > 95%
- [ ] Cart abandonment rate < 70%

## Support Contacts

Keep these handy:
- Railway Support: support@railway.app
- Render Support: support@render.com
- Stripe Support: support.stripe.com
- Supabase Support: support@supabase.io
- Your DevOps Engineer: [contact]
- Your Database Admin: [contact]

---

Remember: **Take backups before any major changes!**

Good luck with your production deployment! 🚀