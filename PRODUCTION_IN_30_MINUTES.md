# Production in 30 Minutes - Ultimate Quick Start Guide

## 🚀 Zero to Production Checklist

This guide gets you from zero to a fully deployed production e-commerce store in 30 minutes or less.

### Prerequisites (5 minutes)
- [ ] GitHub account
- [ ] Credit card for services (most have free tiers)
- [ ] Basic command line knowledge

## Option 1: Fastest Path - Vercel + Supabase (15 minutes)

### Step 1: Clone and Prepare (2 minutes)
```bash
git clone https://github.com/your-repo/indecisive-wear-store
cd indecisive-wear-store
./scripts/setup-env.sh
```

### Step 2: Create Accounts (3 minutes)
1. **Vercel**: https://vercel.com/signup
2. **Supabase**: https://app.supabase.com/sign-up
3. **Stripe**: https://dashboard.stripe.com/register

### Step 3: Deploy Frontend (3 minutes)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Note your frontend URL: https://your-app.vercel.app
```

### Step 4: Setup Database (5 minutes)
1. Create new Supabase project
2. Wait for provisioning (~2 minutes)
3. Go to Settings > Database
4. Copy connection string
5. Update `.env.production`:
```env
DATABASE_URL=your-supabase-connection-string
```

### Step 5: Deploy Backend (2 minutes)
```bash
cd backend
vercel --env-file ../.env.production
# Note your backend URL: https://your-backend.vercel.app
```

### Step 6: Final Configuration
Update frontend environment:
```bash
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL
# Enter: https://your-backend.vercel.app
```

**✅ Done! Your store is live!**

---

## Option 2: One-Click Railway Deploy (10 minutes)

### Step 1: Quick Setup (2 minutes)
```bash
# Clone repo
git clone https://github.com/your-repo/indecisive-wear-store
cd indecisive-wear-store

# Generate secrets
./scripts/setup-env.sh
```

### Step 2: Deploy to Railway (5 minutes)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Step 3: Add Services (3 minutes)
In Railway Dashboard:
1. Add PostgreSQL: `railway add postgresql`
2. Add Redis: `railway add redis`
3. Connect services
4. Deploy triggered automatically

**✅ Complete! Check Railway dashboard for URLs**

---

## Option 3: Docker Local Deploy (5 minutes)

### Instant Local Production
```bash
# One command deployment
docker run -d \
  -p 9000:9000 \
  -e DATABASE_URL="postgresql://postgres:postgres@postgres:5432/medusa" \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e COOKIE_SECRET="$(openssl rand -hex 32)" \
  --name medusa \
  ghcr.io/medusajs/medusa:latest

# Frontend
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_MEDUSA_BACKEND_URL="http://localhost:9000" \
  --name frontend \
  your-frontend-image
```

---

## 🎯 Quick Configuration Recipes

### Minimal Production Environment
```env
# Copy this to .env.production
DATABASE_URL=your_database_url
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
STORE_CORS=https://your-frontend.vercel.app
```

### Stripe Test Mode (2 minutes)
1. Login to Stripe Dashboard
2. Copy test keys
3. Add to environment:
```env
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Quick Admin User
```bash
# After deployment
curl -X POST https://your-backend/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

---

## 📊 Cost Breakdown

### Free Tier Limits
| Service | Free Allowance | Typical Usage |
|---------|----------------|---------------|
| Vercel | 100GB bandwidth | ~50k page views |
| Supabase | 500MB database | ~10k products |
| Stripe | No monthly fee | 2.9% + 30¢ per transaction |
| Upstash | 10k commands/day | ~1k daily users |

### When to Upgrade
- **>1000 daily visitors**: Upgrade to Vercel Pro ($20/mo)
- **>500MB data**: Upgrade Supabase ($25/mo)
- **>100 orders/day**: Consider dedicated hosting

---

## 🚨 Emergency Deployment

### 2-Minute Deploy (No Configuration)
```bash
# Using Railway template
railway new \
  --template https://railway.app/template/medusa \
  --name indecisive-wear

# Using Render blueprint
curl -X POST https://api.render.com/deploy/srv-xxx \
  -H "Authorization: Bearer your-api-key" \
  -d '{"clear_cache": true}'
```

### Pre-configured Templates
1. **Railway**: https://railway.app/new/template/medusa
2. **Render**: https://render.com/deploy?repo=your-repo
3. **Heroku**: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

---

## 🛠️ Post-Deployment Checklist

### Immediate (5 minutes)
- [ ] Test checkout flow
- [ ] Verify email sending
- [ ] Check mobile responsiveness
- [ ] Enable HTTPS

### Within 24 hours
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Add custom domain
- [ ] Enable CDN

### Within 1 week
- [ ] SEO optimization
- [ ] Performance audit
- [ ] Security scan
- [ ] Load testing

---

## 📱 Mobile App Deployment

### PWA Quick Setup (5 minutes)
```json
// public/manifest.json
{
  "name": "Indecisive Wear",
  "short_name": "IW Store",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

Add to `app/layout.tsx`:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="mobile-web-app-capable" content="yes" />
```

---

## 🔧 Troubleshooting

### Common Issues & Quick Fixes

**Frontend can't reach backend:**
```bash
# Check CORS settings
curl -I https://your-backend/health
# Should include Access-Control headers
```

**Database connection failed:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Slow performance:**
```bash
# Enable caching
vercel env add ENABLE_CACHE true
```

---

## 🎉 Success Metrics

You know you're production-ready when:
- [ ] Health check returns 200: `curl https://your-backend/health`
- [ ] Frontend loads in <3 seconds
- [ ] Test order completes successfully
- [ ] Admin panel accessible
- [ ] No errors in browser console

---

## 📞 Quick Support

### Community
- Discord: [Join our server](https://discord.gg/medusajs)
- GitHub Issues: [Report problems](https://github.com/your-repo/issues)

### Emergency Fixes
```bash
# Rollback deployment
vercel rollback

# Clear cache
vercel env rm ENABLE_CACHE
vercel redeploy

# Reset database
railway run psql < backup.sql
```

---

**🏁 Congratulations! Your store is live and ready for customers!**

Remember: Start simple, iterate fast, scale when needed.