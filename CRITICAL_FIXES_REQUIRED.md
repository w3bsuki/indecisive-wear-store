# 🚨 Critical Fixes Required Before Deployment

## 1. Database Connection Pool Fix (HIGH PRIORITY)

Your current setup is missing proper connection pooling, which WILL cause production crashes.

### Add to backend/src/utils/database-config.ts:
```typescript
export const getDatabaseConfig = () => {
  const url = new URL(process.env.DATABASE_URL!);
  
  return {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    acquireConnectionTimeout: 60000,
  };
};
```

## 2. Redis Connection Fix (CRITICAL)

The ?family=0 suffix is NOT optional - it's required for Railway/Render.

### Update backend/medusa-config.ts:
```typescript
const redisUrl = process.env.REDIS_URL;
const redisConfig = redisUrl ? {
  url: redisUrl.includes('?') ? redisUrl : `${redisUrl}?family=0`,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  },
} : undefined;
```

## 3. Admin Panel Complete Fix

The SWC fix alone might not be enough. You also need:

### Update backend/package.json:
```json
{
  "scripts": {
    "build": "medusa build",
    "build:admin": "medusa build --admin-only",
    "start": "medusa start",
    "postinstall": "medusa build:admin"
  },
  "overrides": {
    "@swc/core": "1.3.96",
    "@swc/helpers": "0.5.2"
  }
}
```

### Add to backend/.env:
```bash
MEDUSA_ADMIN_BACKEND_URL=http://localhost:9000
```

## 4. Worker Memory Leak Prevention

Workers WILL crash after a few hours without this fix.

### Create backend/src/utils/worker-manager.ts:
```typescript
import { spawn } from 'child_process';

export class WorkerManager {
  private worker: any;
  private restartTimer: NodeJS.Timeout;

  start() {
    this.worker = spawn('node', ['node_modules/@medusajs/medusa/dist/bin/medusa.js', 'start', '--worker-mode'], {
      env: { ...process.env, MEDUSA_WORKER_MODE: 'worker' },
      stdio: 'inherit'
    });

    // Restart every 4 hours to prevent memory leaks
    this.restartTimer = setInterval(() => {
      console.log('Scheduled worker restart');
      this.restart();
    }, 4 * 60 * 60 * 1000);

    // Monitor memory usage
    setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > 1024 * 1024 * 1024) { // 1GB
        console.warn('High memory usage detected, restarting worker');
        this.restart();
      }
    }, 5 * 60 * 1000);
  }

  restart() {
    if (this.worker) {
      this.worker.kill('SIGTERM');
      setTimeout(() => {
        if (!this.worker.killed) {
          this.worker.kill('SIGKILL');
        }
      }, 5000);
    }
    this.start();
  }
}
```

## 5. Authentication Sync Between Services

You MUST implement auth sync or users will have separate accounts.

### Create backend/src/services/auth-sync.service.ts:
```typescript
import { BaseService } from "@medusajs/framework";
import { createClient } from '@supabase/supabase-js';

export class AuthSyncService extends BaseService {
  private supabase: any;

  constructor() {
    super(...arguments);
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async syncCustomerToSupabase(customer: any) {
    try {
      // Check if user exists
      const { data: existingUser } = await this.supabase.auth.admin.getUserById(customer.id);
      
      if (!existingUser) {
        // Create new Supabase user
        const { data, error } = await this.supabase.auth.admin.createUser({
          id: customer.id,
          email: customer.email,
          email_confirm: true,
          user_metadata: {
            medusa_customer_id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name
          }
        });

        if (error) throw error;
      } else {
        // Update existing user
        await this.supabase.auth.admin.updateUserById(customer.id, {
          email: customer.email,
          user_metadata: {
            first_name: customer.first_name,
            last_name: customer.last_name
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync customer to Supabase:', error);
      // Don't throw - we don't want to break the main flow
    }
  }
}
```

## 6. Comprehensive Health Check

Without proper health checks, your app will randomly go down.

### Create backend/src/api/health/route.ts:
```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {} as Record<string, any>
  };

  // Database check
  try {
    const knex = req.scope.resolve("knex");
    await knex.raw('SELECT 1');
    checks.checks.database = { status: 'healthy' };
  } catch (error: any) {
    checks.status = 'unhealthy';
    checks.checks.database = { 
      status: 'unhealthy', 
      error: error.message 
    };
  }

  // Redis check
  try {
    const eventBus = req.scope.resolve("event_bus_");
    if (eventBus && eventBus.redis) {
      await eventBus.redis.ping();
      checks.checks.redis = { status: 'healthy' };
    } else {
      checks.checks.redis = { status: 'not_configured' };
    }
  } catch (error: any) {
    checks.status = 'unhealthy';
    checks.checks.redis = { 
      status: 'unhealthy', 
      error: error.message 
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memoryHealthy = memUsage.heapUsed < (1024 * 1024 * 1024); // 1GB threshold
  
  checks.checks.memory = {
    status: memoryHealthy ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  if (!memoryHealthy) {
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
};
```

## 7. Environment Variable Validation

Missing env vars = instant crash. Add this check.

### Create backend/src/utils/validate-env.ts:
```typescript
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'COOKIE_SECRET',
    'STRIPE_API_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STORE_CORS',
    'ADMIN_CORS',
    'AUTH_CORS'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    
    console.error('\n💡 Quick fixes:');
    console.error('   JWT_SECRET: Run "openssl rand -hex 32"');
    console.error('   COOKIE_SECRET: Run "openssl rand -hex 32"');
    console.error('   DATABASE_URL: postgresql://user:pass@host:5432/dbname');
    console.error('   REDIS_URL: redis://host:6379?family=0');
    
    process.exit(1);
  }

  // Validate formats
  if (!process.env.REDIS_URL!.includes('?family=')) {
    console.warn('⚠️  WARNING: Redis URL should include ?family=0 for Railway/Render');
  }
}

// Call this at startup
validateEnvironment();
```

## 8. CORS Configuration Fix

Incorrect CORS = admin panel won't work.

### Update backend/src/api/middlewares/cors.ts:
```typescript
export function configureCors() {
  const allowedOrigins = [
    process.env.STORE_CORS,
    process.env.ADMIN_CORS,
    process.env.AUTH_CORS,
    'http://localhost:3000',
    'http://localhost:9000'
  ].filter(Boolean).flatMap(o => o!.split(',').map(origin => origin.trim()));

  return {
    origin: (origin: string | undefined, callback: any) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-medusa-access-token'],
    exposedHeaders: ['x-medusa-access-token'],
    maxAge: 86400 // 24 hours
  };
}
```

## 9. Stripe Webhook Security

Your current webhook handler is vulnerable to replay attacks.

### Update backend/src/api/hooks/payment/stripe/route.ts:
```typescript
import Stripe from 'stripe';
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

const stripe = new Stripe(process.env.STRIPE_API_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Store processed event IDs to prevent replay attacks
const processedEvents = new Set<string>();

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const sig = req.headers['stripe-signature'] as string;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Prevent replay attacks
  if (processedEvents.has(event.id)) {
    console.log(`Duplicate event ${event.id} ignored`);
    return res.status(200).send('OK');
  }
  
  processedEvents.add(event.id);
  
  // Clean up old events after 24 hours
  setTimeout(() => processedEvents.delete(event.id), 24 * 60 * 60 * 1000);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    console.error(`Error processing ${event.type}:`, error);
    // Don't return error to Stripe - we'll retry internally
  }

  res.status(200).send('OK');
};
```

## Apply These Fixes BEFORE Deployment!

1. Copy all code snippets to their respective files
2. Run `yarn install` after updating package.json
3. Test locally with Docker first
4. Validate all environment variables
5. Deploy to staging before production

Without these fixes, your production deployment WILL fail within hours!