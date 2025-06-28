import { getDatabaseConfig } from "./src/utils/database-config"
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())


const plugins = [
  {
    resolve: `@medusajs/payment-stripe`,
    options: {
      api_key: process.env.STRIPE_API_KEY,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  {
    resolve: `medusa-file-supabase`,
    options: {
      project_url: process.env.SUPABASE_URL,
      api_key: process.env.SUPABASE_KEY,
      bucket: process.env.SUPABASE_BUCKET,
    },
  },
];

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'COOKIE_SECRET', 'DATABASE_URL']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`)
  }
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  admin: {
    disable: false,
    backendUrl: process.env.MEDUSA_ADMIN_BACKEND_URL || 'http://localhost:9000',
  },
  plugins,
})
