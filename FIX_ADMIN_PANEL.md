# URGENT: Fix Admin Panel Issue

## Immediate Solution

1. **Add to your backend/package.json:**
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

2. **Rebuild completely:**
```bash
cd backend
rm -rf node_modules yarn.lock
yarn install
yarn build
```

3. **Check environment variables:**
```bash
# Must have these for admin to work:
NODE_ENV=production
JWT_SECRET=<32-char-string>  # Generate: openssl rand -hex 32
COOKIE_SECRET=<32-char-string>
ADMIN_CORS=https://your-deployment-url.com
```

4. **Verify admin is not disabled:**
```bash
# Make sure this is NOT set or is false:
DISABLE_MEDUSA_ADMIN=false
```

## If Still Not Working

Run diagnostics:
```bash
# Check if admin bundle exists
ls -la .medusa/admin

# Check server logs for errors
yarn dev 2>&1 | grep -i admin

# Verify build output
yarn build:admin
```

## Common Causes:
- Missing JWT_SECRET or COOKIE_SECRET
- CORS misconfiguration
- Worker mode running instead of server mode
- Build artifacts missing
- Port 9000 blocked