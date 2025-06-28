import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const cartOperations = new Trend('cart_operations');
const databaseOperations = new Trend('database_operations');

// Stress test configuration - pushes system to its limits
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 300 },   // Ramp up to 300 users
    { duration: '5m', target: 400 },   // Ramp up to 400 users
    { duration: '10m', target: 400 },  // Stay at 400 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s during stress
    http_req_failed: ['rate<0.2'],     // Error rate under 20% during stress
    errors: ['rate<0.2'],              // Custom error rate under 20%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://test-medusa:9000';

// Simulate heavy database operations
function heavyDatabaseOperation() {
  const start = Date.now();
  
  // Create multiple carts rapidly
  const carts = [];
  for (let i = 0; i < 3; i++) {
    const response = http.post(
      `${BASE_URL}/store/carts`,
      JSON.stringify({}),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (response.status === 200) {
      carts.push(JSON.parse(response.body).cart);
    }
  }
  
  databaseOperations.add(Date.now() - start);
  return carts;
}

// Simulate complex cart operations
function complexCartOperation(cartId) {
  const start = Date.now();
  
  // Multiple updates to the same cart
  const operations = [
    { email: `stress-test-${Date.now()}@example.com` },
    { region_id: 'test-region' },
    { metadata: { test: 'stress-test', timestamp: Date.now() } },
  ];
  
  for (const update of operations) {
    http.post(
      `${BASE_URL}/store/carts/${cartId}`,
      JSON.stringify(update),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  cartOperations.add(Date.now() - start);
}

export default function() {
  // Aggressive health checking
  const health = http.get(`${BASE_URL}/health`);
  const healthOk = check(health, {
    'System healthy': (r) => r.status === 200,
  });
  
  if (!healthOk) {
    errorRate.add(1);
    sleep(5); // Back off if system is unhealthy
    return;
  }
  
  // Scenario 1: Product listing under load
  const products = http.get(`${BASE_URL}/store/products?limit=100`);
  check(products, {
    'Products load under stress': (r) => r.status === 200,
  });
  
  // Scenario 2: Heavy database operations
  const carts = heavyDatabaseOperation();
  
  // Scenario 3: Complex cart operations
  if (carts.length > 0) {
    complexCartOperation(carts[0].id);
  }
  
  // Scenario 4: Concurrent requests
  const batch = http.batch([
    ['GET', `${BASE_URL}/store/products`],
    ['GET', `${BASE_URL}/store/regions`],
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/monitoring`],
  ]);
  
  batch.forEach((response, index) => {
    check(response, {
      [`Batch request ${index} OK`]: (r) => r.status < 500,
    });
  });
  
  // Scenario 5: Search with complex queries
  const complexSearch = http.get(
    `${BASE_URL}/store/products?q=test&limit=50&offset=0&category=clothing&price_lt=10000`
  );
  
  check(complexSearch, {
    'Complex search handles load': (r) => r.status < 500,
  });
  
  // Minimal sleep to maximize load
  sleep(0.5);
}

// Monitor system degradation
export function handleSummary(data) {
  const errorThreshold = 0.2; // 20% error rate
  const p95Threshold = 5000;   // 5 seconds
  
  const errorRateValue = data.metrics.errors ? data.metrics.errors.rate : 0;
  const p95Duration = data.metrics.http_req_duration ? data.metrics.http_req_duration['p(95)'] : 0;
  
  console.log('=== STRESS TEST SUMMARY ===');
  console.log(`Error Rate: ${(errorRateValue * 100).toFixed(2)}%`);
  console.log(`95th Percentile Response Time: ${p95Duration.toFixed(0)}ms`);
  console.log(`Total Requests: ${data.metrics.http_reqs ? data.metrics.http_reqs.count : 0}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed ? data.metrics.http_req_failed.passes : 0}`);
  
  if (errorRateValue > errorThreshold) {
    console.log('❌ STRESS TEST FAILED: Error rate exceeded threshold');
  } else if (p95Duration > p95Threshold) {
    console.log('⚠️  STRESS TEST WARNING: Response times degraded but system remained stable');
  } else {
    console.log('✅ STRESS TEST PASSED: System handled load well');
  }
  
  return {
    'stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}