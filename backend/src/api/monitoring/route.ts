import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const startTime = Date.now()
  
  // Get services from container
  const container = req.scope
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  // Basic health metrics
  const metrics = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "unknown",
    
    // System metrics
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        rss: process.memoryUsage().rss / 1024 / 1024,
        external: process.memoryUsage().external / 1024 / 1024,
      },
      cpu: process.cpuUsage(),
    },
    
    // Service health checks
    services: {
      database: "unknown",
      redis: "unknown",
      storage: "unknown",
    },
  }
  
  // Check database health
  try {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex.raw("SELECT 1")
    metrics.services.database = "healthy"
  } catch (error) {
    metrics.services.database = "unhealthy"
    metrics.status = "degraded"
    logger.error("Database health check failed", error)
  }
  
  // Check Redis health
  try {
    const redis = container.resolve(ContainerRegistrationKeys.REDIS) as any
    if (redis && redis.ping) {
      await redis.ping()
      metrics.services.redis = "healthy"
    } else {
      metrics.services.redis = "not configured"
    }
  } catch (error) {
    metrics.services.redis = "unhealthy"
    metrics.status = "degraded"
    logger.error("Redis health check failed", error)
  }
  
  // Check storage health (Supabase)
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      // Simple check to see if environment is configured
      metrics.services.storage = "configured"
    } else {
      metrics.services.storage = "not configured"
    }
  } catch (error) {
    metrics.services.storage = "error"
    logger.error("Storage health check failed", error)
  }
  
  // Add response time
  const responseTime = Date.now() - startTime
  
  // Set appropriate status code
  const statusCode = metrics.status === "healthy" ? 200 : 503
  
  res.status(statusCode).json({
    ...metrics,
    responseTime: `${responseTime}ms`,
  })
}

// Lightweight health check endpoint
export async function HEAD(req: MedusaRequest, res: MedusaResponse) {
  res.status(200).end()
}