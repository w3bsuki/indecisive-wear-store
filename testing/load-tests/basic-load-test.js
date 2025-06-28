import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const cartCreationRate = new Rate('cart_creation_success');
const productFetchRate = new Rate('product_fetch_success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],                    // Error rate under 10%
    errors: ['rate<0.1'],                             // Custom error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://test-medusa:9000';

// Helper function to handle API responses
function handleResponse(response, metricRate, operationName) {
  const success = check(response, {
    [`${operationName} - status 200`]: (r) => r.status === 200,
    [`${operationName} - response time < 2s`]: (r) => r.timings.duration < 2000,
  });
  
  metricRate.add(success);
  errorRate.add(!success);
  
  if (!success) {
    console.error(`${operationName} failed:`, response.status, response.body);
  }
  
  return success;
}

// Test scenarios
export default function() {
  // Scenario 1: Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'Health check OK': (r) => r.status === 200,
  });
  
  sleep(1);
  
  // Scenario 2: Browse products
  const productsResponse = http.get(`${BASE_URL}/store/products`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (handleResponse(productsResponse, productFetchRate, 'Fetch Products')) {
    const products = JSON.parse(productsResponse.body).products || [];
    
    // Scenario 3: View product details
    if (products.length > 0) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const productDetail = http.get(`${BASE_URL}/store/products/${randomProduct.id}`);
      
      check(productDetail, {
        'Product detail loads': (r) => r.status === 200,
      });
    }
  }
  
  sleep(2);
  
  // Scenario 4: Create cart
  const cartResponse = http.post(
    `${BASE_URL}/store/carts`,
    JSON.stringify({}),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (handleResponse(cartResponse, cartCreationRate, 'Create Cart')) {
    const cart = JSON.parse(cartResponse.body).cart;
    
    // Scenario 5: Get cart
    const getCartResponse = http.get(`${BASE_URL}/store/carts/${cart.id}`);
    check(getCartResponse, {
      'Cart retrieval OK': (r) => r.status === 200,
    });
    
    // Scenario 6: Update cart (add email)
    const updateCartResponse = http.post(
      `${BASE_URL}/store/carts/${cart.id}`,
      JSON.stringify({
        email: `test-${Date.now()}@example.com`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    check(updateCartResponse, {
      'Cart update OK': (r) => r.status === 200,
    });
  }
  
  sleep(3);
  
  // Scenario 7: Search products (if endpoint exists)
  const searchResponse = http.get(`${BASE_URL}/store/products?q=shirt`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  check(searchResponse, {
    'Search works': (r) => r.status === 200 || r.status === 404,
  });
  
  // Random sleep to simulate real user behavior
  sleep(Math.random() * 5 + 1);
}

// Setup function - runs once per VU
export function setup() {
  // Test if the API is accessible
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`API is not accessible. Status: ${res.status}`);
  }
  
  console.log('Load test starting...');
  console.log(`Target URL: ${BASE_URL}`);
  
  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  console.log('Load test completed.');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}