/**
 * Application Entry Point with Production Enhancements
 * 
 * This file integrates all production-ready components:
 * - Environment validation
 * - Worker management
 * - Database pooling
 * - Redis caching
 * - Graceful shutdown
 */

import { startWorkerManager, WorkerManager } from './utils/worker-manager'
import { validateEnv } from './scripts/validate-env'
import { getDatabasePool, shutdownDatabasePool } from './utils/database-config'
import { getRedisClient, shutdownRedis } from './utils/redis-config'
import cluster from 'cluster'

/**
 * Application configuration
 */
interface AppConfig {
  enableClustering: boolean
  enableRedis: boolean
  validateEnvironment: boolean
}

/**
 * Start the application with production features
 */
async function startApplication(config: AppConfig = {
  enableClustering: process.env.ENABLE_CLUSTERING === 'true',
  enableRedis: !!process.env.REDIS_URL,
  validateEnvironment: process.env.NODE_ENV === 'production',
}) {
  try {
    // Validate environment variables
    if (config.validateEnvironment) {
      console.log('🔍 Validating environment configuration...')
      validateEnv()
    }

    // Initialize database pool
    console.log('🗄️  Initializing database connection pool...')
    const dbPool = getDatabasePool()
    await dbPool.testConnection()
    console.log('✅ Database connection established')

    // Initialize Redis if configured
    if (config.enableRedis) {
      console.log('🔴 Initializing Redis connection...')
      const redis = getRedisClient()
      
      await new Promise<void>((resolve, reject) => {
        redis.once('ready', () => {
          console.log('✅ Redis connection established')
          resolve()
        })
        redis.once('error', reject)
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Redis connection timeout')), 10000)
      })
    }

    // Start worker manager if clustering is enabled
    if (config.enableClustering && cluster.isPrimary) {
      console.log('👷 Starting worker manager...')
      const workerManager = await startWorkerManager({
        maxMemoryMB: parseInt(process.env.WORKER_MAX_MEMORY || '512', 10),
        minWorkers: parseInt(process.env.WORKER_MIN || '2', 10),
        maxWorkers: parseInt(process.env.WORKER_MAX || '4', 10),
        autoScale: process.env.WORKER_AUTO_SCALE === 'true',
      })

      // Monitor worker events
      workerManager.on('worker:started', (workerId) => {
        console.log(`✅ Worker ${workerId} started`)
      })

      workerManager.on('worker:died', (workerId, code, signal) => {
        console.error(`❌ Worker ${workerId} died (${signal || code})`)
      })

      workerManager.on('worker:memory-exceeded', (workerId, memory) => {
        console.warn(`⚠️  Worker ${workerId} memory exceeded: ${memory.toFixed(2)}MB`)
      })
    } else {
      // Start Medusa application
      console.log('🚀 Starting Medusa application...')
      require('./medusa-start')
    }

    // Set up graceful shutdown
    setupGracefulShutdown()

  } catch (error) {
    console.error('❌ Failed to start application:', error)
    process.exit(1)
  }
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown() {
  let isShuttingDown = false

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return
    
    isShuttingDown = true
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`)

    try {
      // Shutdown database connections
      console.log('📤 Closing database connections...')
      await shutdownDatabasePool()

      // Shutdown Redis connections
      if (process.env.REDIS_URL) {
        console.log('📤 Closing Redis connections...')
        await shutdownRedis()
      }

      console.log('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }

  // Handle termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    shutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    shutdown('unhandledRejection')
  })
}

/**
 * Create Medusa start wrapper
 */
function createMedusaStart() {
  const content = `/**
 * Medusa Application Starter
 * This file starts the Medusa application with the standard configuration
 */

import { Medusa } from '@medusajs/medusa'
import express from 'express'
import { getConfigFile } from '@medusajs/medusa/dist/core/config'
import { track } from '@medusajs/medusa/dist/event-bus'

async function start() {
  const configModule = getConfigFile(process.cwd(), 'medusa-config')
  
  const app = express()
  const { shutdown } = await Medusa(app, configModule)
  
  const port = process.env.PORT || 9000
  
  const server = app.listen(port, () => {
    console.log(\`✅ Medusa server started on port \${port}\`)
    track('CLI_START')
  })
  
  // Store server reference for graceful shutdown
  ;(global as any).server = server
  
  return { app, server, shutdown }
}

// Start if called directly
if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start Medusa:', err)
    process.exit(1)
  })
}

export default start
`

  require('fs').writeFileSync(
    require('path').join(__dirname, 'medusa-start.ts'),
    content
  )
}

// Ensure medusa-start.ts exists
if (!require('fs').existsSync(require('path').join(__dirname, 'medusa-start.ts'))) {
  createMedusaStart()
}

// Start the application
if (require.main === module) {
  startApplication()
}

export { startApplication }