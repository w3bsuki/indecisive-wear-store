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

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
};
