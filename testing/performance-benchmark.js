#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * Measures and validates performance improvements
 */

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:9000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  api: {
    health: 100,
    products: 500,
    cart: 300,
    search: 1000,
  },
  database: {
    simpleQuery: 50,
    complexQuery: 500,
    connection: 100,
  },
  frontend: {
    firstContentfulPaint: 2000,
    timeToInteractive: 3000,
    pageLoad: 5000,
  },
};

// Benchmark results storage
const results = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  benchmarks: {},
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

// Helper function to measure execution time
async function measureTime(name, fn) {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return { success: true, duration, result };
  } catch (error) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    return { success: false, duration, error: error.message };
  }
}

// API Performance Benchmarks
async function benchmarkAPI() {
  console.log(chalk.blue('\n📊 API Performance Benchmarks\n'));
  
  const apiResults = {};
  
  // Health endpoint
  const healthBenchmark = await measureTime('Health Endpoint', async () => {
    return await axios.get(`${API_URL}/health`);
  });
  
  apiResults.health = {
    duration: healthBenchmark.duration,
    threshold: THRESHOLDS.api.health,
    status: healthBenchmark.duration < THRESHOLDS.api.health ? 'PASS' : 'FAIL',
  };
  
  logBenchmark('Health Endpoint', healthBenchmark.duration, THRESHOLDS.api.health);
  
  // Products listing
  const productsBenchmark = await measureTime('Products Listing', async () => {
    return await axios.get(`${API_URL}/store/products?limit=50`);
  });
  
  apiResults.products = {
    duration: productsBenchmark.duration,
    threshold: THRESHOLDS.api.products,
    status: productsBenchmark.duration < THRESHOLDS.api.products ? 'PASS' : 'FAIL',
  };
  
  logBenchmark('Products Listing', productsBenchmark.duration, THRESHOLDS.api.products);
  
  // Cart operations
  const cartBenchmark = await measureTime('Cart Creation', async () => {
    return await axios.post(`${API_URL}/store/carts`, {}, {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  apiResults.cart = {
    duration: cartBenchmark.duration,
    threshold: THRESHOLDS.api.cart,
    status: cartBenchmark.duration < THRESHOLDS.api.cart ? 'PASS' : 'FAIL',
  };
  
  logBenchmark('Cart Creation', cartBenchmark.duration, THRESHOLDS.api.cart);
  
  // Search performance
  const searchBenchmark = await measureTime('Product Search', async () => {
    return await axios.get(`${API_URL}/store/products?q=shirt&limit=20`);
  });
  
  apiResults.search = {
    duration: searchBenchmark.duration,
    threshold: THRESHOLDS.api.search,
    status: searchBenchmark.duration < THRESHOLDS.api.search ? 'PASS' : 'FAIL',
  };
  
  logBenchmark('Product Search', searchBenchmark.duration, THRESHOLDS.api.search);
  
  results.benchmarks.api = apiResults;
}

// Concurrent Request Benchmarks
async function benchmarkConcurrency() {
  console.log(chalk.blue('\n🔄 Concurrent Request Benchmarks\n'));
  
  const concurrencyResults = {};
  
  // Test with 10 concurrent requests
  const concurrent10 = await measureTime('10 Concurrent Requests', async () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(axios.get(`${API_URL}/store/products`));
    }
    return await Promise.all(requests);
  });
  
  concurrencyResults.concurrent10 = {
    duration: concurrent10.duration,
    avgPerRequest: concurrent10.duration / 10,
    status: concurrent10.duration < 3000 ? 'PASS' : 'FAIL',
  };
  
  logBenchmark('10 Concurrent Requests', concurrent10.duration, 3000);
  
  // Test with 50 concurrent requests
  const concurrent50 = await measureTime('50 Concurrent Requests', async () => {
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(axios.get(`${API_URL}/health`));
    }
    return await Promise.all(requests);
  });
  
  concurrencyResults.concurrent50 = {
    duration: concurrent50.duration,
    avgPerRequest: concurrent50.duration / 50,
    status: concurrent50.duration < 5000 ? 'PASS' : 'FAIL',
  };
  
  logBenchmark('50 Concurrent Requests', concurrent50.duration, 5000);
  
  results.benchmarks.concurrency = concurrencyResults;
}

// Memory Usage Benchmarks
async function benchmarkMemory() {
  console.log(chalk.blue('\n💾 Memory Usage Benchmarks\n'));
  
  const memoryResults = {};
  
  // Get current memory usage
  if (process.memoryUsage) {
    const memUsage = process.memoryUsage();
    memoryResults.current = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    
    console.log(`Heap Used: ${memoryResults.current.heapUsed}MB`);
    console.log(`Heap Total: ${memoryResults.current.heapTotal}MB`);
    console.log(`RSS: ${memoryResults.current.rss}MB`);
    
    // Check if memory usage is reasonable
    if (memoryResults.current.heapUsed < 500) {
      console.log(chalk.green('✓ Memory usage is within acceptable limits'));
      results.summary.passed++;
    } else {
      console.log(chalk.yellow('⚠ High memory usage detected'));
      results.summary.warnings++;
    }
  }
  
  results.benchmarks.memory = memoryResults;
}

// Cache Performance Benchmarks
async function benchmarkCache() {
  console.log(chalk.blue('\n🚀 Cache Performance Benchmarks\n'));
  
  const cacheResults = {};
  
  // First request (cache miss)
  const firstRequest = await measureTime('First Request (Cache Miss)', async () => {
    return await axios.get(`${API_URL}/store/products?limit=10`);
  });
  
  cacheResults.cacheMiss = {
    duration: firstRequest.duration,
  };
  
  // Second request (cache hit)
  const secondRequest = await measureTime('Second Request (Cache Hit)', async () => {
    return await axios.get(`${API_URL}/store/products?limit=10`);
  });
  
  cacheResults.cacheHit = {
    duration: secondRequest.duration,
  };
  
  // Calculate cache effectiveness
  const cacheImprovement = ((firstRequest.duration - secondRequest.duration) / firstRequest.duration) * 100;
  cacheResults.improvement = cacheImprovement;
  
  console.log(`Cache Miss: ${firstRequest.duration.toFixed(2)}ms`);
  console.log(`Cache Hit: ${secondRequest.duration.toFixed(2)}ms`);
  console.log(`Cache Improvement: ${cacheImprovement.toFixed(2)}%`);
  
  if (cacheImprovement > 20) {
    console.log(chalk.green('✓ Cache is effective'));
    results.summary.passed++;
  } else {
    console.log(chalk.yellow('⚠ Cache improvement is minimal'));
    results.summary.warnings++;
  }
  
  results.benchmarks.cache = cacheResults;
}

// Helper function to log benchmark results
function logBenchmark(name, duration, threshold) {
  const status = duration < threshold;
  results.summary.totalTests++;
  
  if (status) {
    console.log(chalk.green(`✓ ${name}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`));
    results.summary.passed++;
  } else {
    console.log(chalk.red(`✗ ${name}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`));
    results.summary.failed++;
  }
}

// Generate performance report
function generateReport() {
  const reportFile = `performance-report-${Date.now()}.json`;
  const fs = require('fs');
  
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  
  console.log(chalk.blue('\n📊 Performance Benchmark Summary\n'));
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(chalk.green(`Passed: ${results.summary.passed}`));
  console.log(chalk.red(`Failed: ${results.summary.failed}`));
  console.log(chalk.yellow(`Warnings: ${results.summary.warnings}`));
  
  const score = (results.summary.passed / results.summary.totalTests) * 100;
  console.log(`\nPerformance Score: ${score.toFixed(2)}%`);
  
  if (score >= 90) {
    console.log(chalk.green('\n✅ Excellent performance!'));
  } else if (score >= 70) {
    console.log(chalk.yellow('\n⚠️  Performance needs improvement'));
  } else {
    console.log(chalk.red('\n❌ Poor performance - optimization required'));
  }
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
}

// Main execution
async function main() {
  console.log(chalk.bold('================================'));
  console.log(chalk.bold('PERFORMANCE BENCHMARK SUITE'));
  console.log(chalk.bold('================================'));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Check if services are running
    await axios.get(`${API_URL}/health`);
    
    // Run all benchmarks
    await benchmarkAPI();
    await benchmarkConcurrency();
    await benchmarkMemory();
    await benchmarkCache();
    
    // Generate report
    generateReport();
    
    // Exit code based on results
    if (results.summary.failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('\nError: Services are not accessible'));
    console.error(error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { measureTime, benchmarkAPI };