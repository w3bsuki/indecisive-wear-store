import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'COOKIE_SECRET',
  'DATABASE_URL',
  'STRIPE_API_KEY',
  'STRIPE_WEBHOOK_SECRET'
]

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
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              // Production configuration
              automatic_payment_methods: false,
              payment_method_types: [
                "card",
                "ideal", // European payments
                "sepa_debit", // SEPA Direct Debit
                "bancontact", // Belgium
                "giropay", // Germany
                "eps", // Austria
                "p24", // Poland
                "alipay", // China
                "wechat_pay", // China
                "klarna", // Buy now, pay later
                "afterpay_clearpay", // Buy now, pay later
                "link", // Stripe Link
              ],
              capture: true, // Auto-capture payments
              payment_description: "Indecisive Wear Store Purchase",
              // Fraud prevention
              stripe_options: {
                apiVersion: "2024-11-20.acacia",
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/tax",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/tax-system",
            id: "system",
            options: {
              // Tax configuration for different regions
            },
          },
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: `medusa-file-supabase`,
      options: {
        project_url: process.env.SUPABASE_URL,
        api_key: process.env.SUPABASE_KEY,
        bucket: process.env.SUPABASE_BUCKET,
      },
    },
  ],
})