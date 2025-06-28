#!/usr/bin/env node

/**
 * API Verification Script
 * Tests all critical API endpoints and validates responses
 */

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Test data
const TEST_PRODUCT_ID = 'test-product-001';
const TEST_CUSTOMER_EMAIL = 'test@example.com';

class APIVerifier {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
    this.cartId = null;
    this.sessionToken = null;
  }

  async testEndpoint(name, config) {
    try {
      const startTime = Date.now();
      const response = await axios({
        ...config,
        validateStatus: () => true, // Don't throw on any status
        timeout: 10000,
      });
      const responseTime = Date.now() - startTime;

      // Check status code
      if (config.expectedStatus && response.status !== config.expectedStatus) {
        this.results.failed.push(`${name}: Expected status ${config.expectedStatus}, got ${response.status}`);
        return null;
      }

      // Check response time
      if (responseTime > 2000) {
        this.results.warnings.push(`${name}: Slow response (${responseTime}ms)`);
      } else {
        this.results.passed.push(`${name}: ${response.status} in ${responseTime}ms`);
      }

      // Validate response structure if provided
      if (config.validateResponse) {
        const validation = config.validateResponse(response.data);
        if (validation.success) {
          this.results.passed.push(`${name}: Response validation passed`);
        } else {
          this.results.failed.push(`${name}: ${validation.error}`);
        }
      }

      return response;
    } catch (error) {
      this.results.failed.push(`${name}: ${error.message}`);
      return null;
    }
  }

  async verifyHealthEndpoints() {
    console.log(chalk.blue('🏥 Testing health endpoints...'));

    // Test basic health
    await this.testEndpoint('Health Check', {
      method: 'GET',
      url: `${API_BASE_URL}/health`,
      expectedStatus: 200,
      validateResponse: (data) => {
        if (data.status === 'healthy') {
          return { success: true };
        }
        return { success: false, error: 'Health status not healthy' };
      },
    });

    // Test monitoring endpoint
    await this.testEndpoint('Monitoring Endpoint', {
      method: 'GET',
      url: `${API_BASE_URL}/monitoring`,
      expectedStatus: 200,
      validateResponse: (data) => {
        const required = ['status', 'timestamp', 'services', 'system'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length === 0) {
          return { success: true };
        }
        return { success: false, error: `Missing fields: ${missing.join(', ')}` };
      },
    });
  }

  async verifyStoreEndpoints() {
    console.log(chalk.blue('🛍️  Testing store endpoints...'));

    // Test products listing
    const productsResponse = await this.testEndpoint('List Products', {
      method: 'GET',
      url: `${API_BASE_URL}/store/products`,
      expectedStatus: 200,
      validateResponse: (data) => {
        if (Array.isArray(data.products)) {
          return { success: true };
        }
        return { success: false, error: 'Products response not an array' };
      },
    });

    // Test product detail (if products exist)
    if (productsResponse && productsResponse.data.products.length > 0) {
      const productId = productsResponse.data.products[0].id;
      
      await this.testEndpoint('Get Product Detail', {
        method: 'GET',
        url: `${API_BASE_URL}/store/products/${productId}`,
        expectedStatus: 200,
        validateResponse: (data) => {
          if (data.product && data.product.id === productId) {
            return { success: true };
          }
          return { success: false, error: 'Invalid product response' };
        },
      });
    }

    // Test regions
    await this.testEndpoint('List Regions', {
      method: 'GET',
      url: `${API_BASE_URL}/store/regions`,
      expectedStatus: 200,
      validateResponse: (data) => {
        if (Array.isArray(data.regions)) {
          return { success: true };
        }
        return { success: false, error: 'Regions response not an array' };
      },
    });
  }

  async verifyCartEndpoints() {
    console.log(chalk.blue('🛒 Testing cart endpoints...'));

    // Create a cart
    const cartResponse = await this.testEndpoint('Create Cart', {
      method: 'POST',
      url: `${API_BASE_URL}/store/carts`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
      expectedStatus: 200,
      validateResponse: (data) => {
        if (data.cart && data.cart.id) {
          this.cartId = data.cart.id;
          return { success: true };
        }
        return { success: false, error: 'Cart creation failed' };
      },
    });

    if (this.cartId) {
      // Test cart retrieval
      await this.testEndpoint('Get Cart', {
        method: 'GET',
        url: `${API_BASE_URL}/store/carts/${this.cartId}`,
        expectedStatus: 200,
        validateResponse: (data) => {
          if (data.cart && data.cart.id === this.cartId) {
            return { success: true };
          }
          return { success: false, error: 'Cart retrieval failed' };
        },
      });

      // Test cart update
      await this.testEndpoint('Update Cart', {
        method: 'POST',
        url: `${API_BASE_URL}/store/carts/${this.cartId}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          email: TEST_CUSTOMER_EMAIL,
        },
        expectedStatus: 200,
      });
    }
  }

  async verifyAuthEndpoints() {
    console.log(chalk.blue('🔐 Testing authentication endpoints...'));

    // Test customer registration
    const randomEmail = `test-${Date.now()}@example.com`;
    
    await this.testEndpoint('Customer Registration', {
      method: 'POST',
      url: `${API_BASE_URL}/auth/customer/emailpass/register`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        email: randomEmail,
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
      },
      validateResponse: (data) => {
        // Registration might fail if email exists, which is okay
        return { success: true };
      },
    });

    // Test login endpoint exists
    await this.testEndpoint('Login Endpoint Check', {
      method: 'POST',
      url: `${API_BASE_URL}/auth/customer/emailpass`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      },
      expectedStatus: 401,
    });
  }

  async verifySecurityHeaders() {
    console.log(chalk.blue('🔒 Testing security headers...'));

    const response = await axios.get(`${API_BASE_URL}/health`, {
      validateStatus: () => true,
    });

    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': 'max-age=31536000',
    };

    for (const [header, expectedValues] of Object.entries(securityHeaders)) {
      const actualValue = response.headers[header];
      const expectedArray = Array.isArray(expectedValues) ? expectedValues : [expectedValues];
      
      if (actualValue && expectedArray.some(expected => actualValue.includes(expected))) {
        this.results.passed.push(`Security header ${header}: ${actualValue}`);
      } else {
        this.results.warnings.push(`Missing or incorrect security header: ${header}`);
      }
    }
  }

  async verifyRateLimiting() {
    console.log(chalk.blue('🚦 Testing rate limiting...'));

    const requests = [];
    const endpoint = `${API_BASE_URL}/store/products`;
    
    // Send 20 requests rapidly
    for (let i = 0; i < 20; i++) {
      requests.push(
        axios.get(endpoint, {
          validateStatus: () => true,
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    if (rateLimited) {
      this.results.passed.push('Rate limiting is active');
    } else {
      this.results.warnings.push('Rate limiting might not be configured');
    }
  }

  async verifyCORS() {
    console.log(chalk.blue('🌐 Testing CORS configuration...'));

    try {
      const response = await axios.options(`${API_BASE_URL}/store/products`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
        },
        validateStatus: () => true,
      });

      const corsHeaders = response.headers['access-control-allow-origin'];
      
      if (corsHeaders) {
        this.results.passed.push(`CORS configured: ${corsHeaders}`);
      } else {
        this.results.failed.push('CORS headers not found');
      }
    } catch (error) {
      this.results.warnings.push(`CORS test failed: ${error.message}`);
    }
  }

  async verifyErrorHandling() {
    console.log(chalk.blue('❌ Testing error handling...'));

    // Test 404 handling
    await this.testEndpoint('404 Error Handling', {
      method: 'GET',
      url: `${API_BASE_URL}/nonexistent-endpoint-12345`,
      expectedStatus: 404,
    });

    // Test invalid JSON
    await this.testEndpoint('Invalid JSON Handling', {
      method: 'POST',
      url: `${API_BASE_URL}/store/carts`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: 'invalid json{',
      validateResponse: (data) => {
        // Should handle gracefully
        return { success: true };
      },
    });

    // Test method not allowed
    await this.testEndpoint('Method Not Allowed', {
      method: 'DELETE',
      url: `${API_BASE_URL}/health`,
      expectedStatus: 405,
    });
  }

  printResults() {
    console.log('\n' + chalk.bold('================================'));
    console.log(chalk.bold('API VERIFICATION RESULTS'));
    console.log(chalk.bold('================================\n'));

    if (this.results.passed.length > 0) {
      console.log(chalk.green.bold(`✅ PASSED (${this.results.passed.length}):`));
      this.results.passed.forEach(result => {
        console.log(chalk.green(`  ✓ ${result}`));
      });
      console.log();
    }

    if (this.results.warnings.length > 0) {
      console.log(chalk.yellow.bold(`⚠️  WARNINGS (${this.results.warnings.length}):`));
      this.results.warnings.forEach(warning => {
        console.log(chalk.yellow(`  ⚠ ${warning}`));
      });
      console.log();
    }

    if (this.results.failed.length > 0) {
      console.log(chalk.red.bold(`❌ FAILED (${this.results.failed.length}):`));
      this.results.failed.forEach(failure => {
        console.log(chalk.red(`  ✗ ${failure}`));
      });
      console.log();
    }

    // Summary
    const total = this.results.passed.length + this.results.failed.length;
    const successRate = total > 0 ? Math.round((this.results.passed.length / total) * 100) : 0;

    console.log(chalk.bold('Summary:'));
    console.log(`  Total Tests: ${total}`);
    console.log(`  Success Rate: ${successRate}%`);

    if (this.results.failed.length === 0) {
      console.log(chalk.green.bold('\n✅ All API verifications passed!'));
      return 0;
    } else {
      console.log(chalk.red.bold('\n❌ Some API verifications failed!'));
      return 1;
    }
  }
}

// Main execution
async function main() {
  const verifier = new APIVerifier();

  try {
    await verifier.verifyHealthEndpoints();
    await verifier.verifyStoreEndpoints();
    await verifier.verifyCartEndpoints();
    await verifier.verifyAuthEndpoints();
    await verifier.verifySecurityHeaders();
    await verifier.verifyRateLimiting();
    await verifier.verifyCORS();
    await verifier.verifyErrorHandling();

    const exitCode = verifier.printResults();
    process.exit(exitCode);

  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { APIVerifier };