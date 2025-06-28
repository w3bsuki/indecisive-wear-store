#!/usr/bin/env node

/**
 * Frontend Verification Script
 * Tests frontend build, accessibility, and critical user flows
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const axe = require('axe-core');

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:9001';

// Test pages
const CRITICAL_PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Products Page', path: '/products' },
  { name: 'Cart Page', path: '/cart' },
  { name: 'About Page', path: '/about' },
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  firstContentfulPaint: 2000, // ms
  largestContentfulPaint: 4000, // ms
  totalBlockingTime: 300, // ms
  cumulativeLayoutShift: 0.1,
};

class FrontendVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  async initialize() {
    console.log(chalk.blue('🌐 Initializing browser...'));
    
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      
      // Set user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );
      
      this.results.passed.push('Browser initialized successfully');
      return true;
    } catch (error) {
      this.results.failed.push(`Browser initialization failed: ${error.message}`);
      return false;
    }
  }

  async testPageLoad(pageName, pagePath) {
    console.log(chalk.blue(`📄 Testing ${pageName}...`));
    
    try {
      const startTime = Date.now();
      
      // Navigate to page
      const response = await this.page.goto(FRONTEND_URL + pagePath, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      const loadTime = Date.now() - startTime;
      
      // Check response status
      if (response.status() === 200) {
        this.results.passed.push(`${pageName} loaded successfully (${loadTime}ms)`);
      } else {
        this.results.failed.push(`${pageName} returned status ${response.status()}`);
        return;
      }
      
      // Check for console errors
      const consoleErrors = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait a bit for any async errors
      await this.page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        this.results.warnings.push(`${pageName} has console errors: ${consoleErrors.join(', ')}`);
      }
      
      // Check page title
      const title = await this.page.title();
      if (title && title.length > 0) {
        this.results.passed.push(`${pageName} has title: "${title}"`);
      } else {
        this.results.warnings.push(`${pageName} has no title`);
      }
      
      // Check for main content
      const hasContent = await this.page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('#__next');
        return main && main.textContent.trim().length > 0;
      });
      
      if (hasContent) {
        this.results.passed.push(`${pageName} has content`);
      } else {
        this.results.failed.push(`${pageName} has no content`);
      }
      
    } catch (error) {
      this.results.failed.push(`${pageName} test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log(chalk.blue('⚡ Testing performance metrics...'));
    
    try {
      // Navigate to homepage and collect metrics
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        };
      });
      
      // Check FCP
      if (metrics.firstContentfulPaint < PERFORMANCE_THRESHOLDS.firstContentfulPaint) {
        this.results.passed.push(`First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`);
      } else {
        this.results.warnings.push(`Slow First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`);
      }
      
      // Check bundle size by monitoring network requests
      const resources = await this.page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          size: entry.transferSize,
          duration: entry.duration,
        }));
      });
      
      const jsSize = resources
        .filter(r => r.name.endsWith('.js'))
        .reduce((sum, r) => sum + r.size, 0);
      
      const cssSize = resources
        .filter(r => r.name.endsWith('.css'))
        .reduce((sum, r) => sum + r.size, 0);
      
      this.results.passed.push(`JavaScript size: ${Math.round(jsSize / 1024)}KB`);
      this.results.passed.push(`CSS size: ${Math.round(cssSize / 1024)}KB`);
      
      // Check for large assets
      const largeAssets = resources.filter(r => r.size > 500 * 1024); // 500KB
      
      if (largeAssets.length > 0) {
        largeAssets.forEach(asset => {
          this.results.warnings.push(`Large asset: ${asset.name.split('/').pop()} (${Math.round(asset.size / 1024)}KB)`);
        });
      }
      
    } catch (error) {
      this.results.failed.push(`Performance test failed: ${error.message}`);
    }
  }

  async testAccessibility() {
    console.log(chalk.blue('♿ Testing accessibility...'));
    
    try {
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Inject axe-core
      await this.page.evaluate(axe.source);
      
      // Run accessibility tests
      const results = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run((err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });
      
      // Process results
      if (results.violations.length === 0) {
        this.results.passed.push('No accessibility violations found');
      } else {
        results.violations.forEach(violation => {
          const impact = violation.impact;
          const message = `${violation.description} (${violation.nodes.length} instances)`;
          
          if (impact === 'critical' || impact === 'serious') {
            this.results.failed.push(`Accessibility: ${message}`);
          } else {
            this.results.warnings.push(`Accessibility: ${message}`);
          }
        });
      }
      
      // Check for proper heading structure
      const headingStructure = await this.page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return {
          h1Count: headings.filter(h => h.tagName === 'H1').length,
          totalHeadings: headings.length,
        };
      });
      
      if (headingStructure.h1Count === 1) {
        this.results.passed.push('Proper H1 usage (exactly one H1)');
      } else {
        this.results.warnings.push(`Found ${headingStructure.h1Count} H1 tags (should be 1)`);
      }
      
    } catch (error) {
      this.results.failed.push(`Accessibility test failed: ${error.message}`);
    }
  }

  async testMobileResponsiveness() {
    console.log(chalk.blue('📱 Testing mobile responsiveness...'));
    
    const mobileDevices = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Galaxy S21', width: 360, height: 800 },
    ];
    
    for (const device of mobileDevices) {
      try {
        await this.page.setViewport({
          width: device.width,
          height: device.height,
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
        });
        
        await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
        
        // Check if mobile menu exists
        const hasMobileMenu = await this.page.evaluate(() => {
          const mobileMenu = document.querySelector('[data-mobile-menu], .mobile-menu, button[aria-label*="menu"]');
          return mobileMenu !== null;
        });
        
        if (hasMobileMenu) {
          this.results.passed.push(`${device.name}: Mobile menu present`);
        } else {
          this.results.warnings.push(`${device.name}: No mobile menu found`);
        }
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await this.page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        if (!hasHorizontalScroll) {
          this.results.passed.push(`${device.name}: No horizontal scroll`);
        } else {
          this.results.failed.push(`${device.name}: Horizontal scroll detected`);
        }
        
      } catch (error) {
        this.results.failed.push(`${device.name} test failed: ${error.message}`);
      }
    }
    
    // Reset viewport
    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
  }

  async testCriticalUserFlows() {
    console.log(chalk.blue('🛤️  Testing critical user flows...'));
    
    try {
      // Test 1: Navigation flow
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Click on products link
      const productsLink = await this.page.$('a[href="/products"]');
      if (productsLink) {
        await productsLink.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const url = this.page.url();
        if (url.includes('/products')) {
          this.results.passed.push('Navigation to products page works');
        } else {
          this.results.failed.push('Navigation to products page failed');
        }
      }
      
      // Test 2: Cart interaction
      const addToCartButton = await this.page.$('[data-testid="add-to-cart"], button:has-text("Add to Cart")');
      if (addToCartButton) {
        await addToCartButton.click();
        await this.page.waitForTimeout(1000);
        
        // Check if cart indicator updated
        const cartCount = await this.page.$eval('[data-testid="cart-count"], .cart-count', el => el.textContent);
        if (cartCount && parseInt(cartCount) > 0) {
          this.results.passed.push('Add to cart functionality works');
        } else {
          this.results.warnings.push('Cart count not updated after adding item');
        }
      } else {
        this.results.warnings.push('No add to cart button found');
      }
      
      // Test 3: Search functionality (if exists)
      const searchInput = await this.page.$('input[type="search"], input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('test product');
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);
        
        this.results.passed.push('Search functionality present');
      }
      
    } catch (error) {
      this.results.failed.push(`User flow test failed: ${error.message}`);
    }
  }

  async testAPIIntegration() {
    console.log(chalk.blue('🔌 Testing API integration...'));
    
    try {
      // Monitor network requests
      const apiCalls = [];
      
      this.page.on('request', request => {
        if (request.url().includes(BACKEND_URL) || request.url().includes('/api/')) {
          apiCalls.push({
            url: request.url(),
            method: request.method(),
          });
        }
      });
      
      await this.page.goto(FRONTEND_URL + '/products', { waitUntil: 'networkidle2' });
      
      // Check if API calls were made
      if (apiCalls.length > 0) {
        this.results.passed.push(`Frontend made ${apiCalls.length} API calls`);
        
        // Check for product-related calls
        const productCalls = apiCalls.filter(call => call.url.includes('products'));
        if (productCalls.length > 0) {
          this.results.passed.push('Product API integration working');
        } else {
          this.results.warnings.push('No product API calls detected');
        }
      } else {
        this.results.failed.push('No API calls detected from frontend');
      }
      
    } catch (error) {
      this.results.failed.push(`API integration test failed: ${error.message}`);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  printResults() {
    console.log('\n' + chalk.bold('================================'));
    console.log(chalk.bold('FRONTEND VERIFICATION RESULTS'));
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
      console.log(chalk.green.bold('\n✅ All frontend verifications passed!'));
      return 0;
    } else {
      console.log(chalk.red.bold('\n❌ Some frontend verifications failed!'));
      return 1;
    }
  }
}

// Main execution
async function main() {
  const verifier = new FrontendVerifier();

  try {
    const initialized = await verifier.initialize();
    
    if (initialized) {
      // Test all critical pages
      for (const page of CRITICAL_PAGES) {
        await verifier.testPageLoad(page.name, page.path);
      }
      
      await verifier.testPerformance();
      await verifier.testAccessibility();
      await verifier.testMobileResponsiveness();
      await verifier.testCriticalUserFlows();
      await verifier.testAPIIntegration();
    }

    await verifier.cleanup();
    const exitCode = verifier.printResults();
    process.exit(exitCode);

  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    await verifier.cleanup();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { FrontendVerifier };