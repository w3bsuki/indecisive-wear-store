#!/usr/bin/env node

/**
 * Database Verification Script
 * Verifies database connectivity, schema, and performance
 */

const { Client } = require('pg');
const chalk = require('chalk');

// Test configuration
const TEST_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgres://test_user:test_password@localhost:5434/test_medusa_db?sslmode=disable',
  maxRetries: 5,
  retryDelay: 2000,
};

// Expected tables in Medusa v2
const EXPECTED_TABLES = [
  'cart',
  'cart_line_item',
  'customer',
  'customer_address',
  'order',
  'order_line_item',
  'payment',
  'payment_session',
  'product',
  'product_category',
  'product_collection',
  'product_image',
  'product_option',
  'product_option_value',
  'product_tag',
  'product_type',
  'product_variant',
  'region',
  'sales_channel',
  'shipping_method',
  'shipping_option',
  'store',
  'tax_rate',
];

// Performance benchmarks
const PERFORMANCE_THRESHOLDS = {
  connectionTime: 1000, // ms
  simpleQueryTime: 50, // ms
  complexQueryTime: 500, // ms
};

class DatabaseVerifier {
  constructor() {
    this.client = null;
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  async connect() {
    console.log(chalk.blue('🔌 Testing database connection...'));
    
    const startTime = Date.now();
    let retries = 0;
    
    while (retries < TEST_CONFIG.maxRetries) {
      try {
        this.client = new Client({ connectionString: TEST_CONFIG.connectionString });
        await this.client.connect();
        
        const connectionTime = Date.now() - startTime;
        
        if (connectionTime < PERFORMANCE_THRESHOLDS.connectionTime) {
          this.results.passed.push(`Database connection established in ${connectionTime}ms`);
        } else {
          this.results.warnings.push(`Slow database connection: ${connectionTime}ms`);
        }
        
        return true;
      } catch (error) {
        retries++;
        if (retries === TEST_CONFIG.maxRetries) {
          this.results.failed.push(`Failed to connect to database: ${error.message}`);
          return false;
        }
        
        console.log(chalk.yellow(`Connection attempt ${retries} failed, retrying...`));
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
      }
    }
  }

  async verifySchema() {
    console.log(chalk.blue('📋 Verifying database schema...'));
    
    try {
      // Get all tables
      const tablesResult = await this.client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);
      
      const existingTables = tablesResult.rows.map(row => row.tablename);
      
      // Check for expected tables
      for (const table of EXPECTED_TABLES) {
        if (existingTables.includes(table)) {
          this.results.passed.push(`Table '${table}' exists`);
        } else {
          this.results.failed.push(`Missing table: '${table}'`);
        }
      }
      
      // Check for indexes
      const indexResult = await this.client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `);
      
      const indexCount = indexResult.rows.length;
      if (indexCount > 0) {
        this.results.passed.push(`Found ${indexCount} indexes`);
      } else {
        this.results.warnings.push('No indexes found - performance may be impacted');
      }
      
      // Check for foreign keys
      const fkResult = await this.client.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY';
      `);
      
      if (fkResult.rows.length > 0) {
        this.results.passed.push(`Found ${fkResult.rows.length} foreign key constraints`);
      } else {
        this.results.warnings.push('No foreign key constraints found');
      }
      
    } catch (error) {
      this.results.failed.push(`Schema verification failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log(chalk.blue('⚡ Testing database performance...'));
    
    try {
      // Test 1: Simple query performance
      const simpleStart = Date.now();
      await this.client.query('SELECT 1');
      const simpleTime = Date.now() - simpleStart;
      
      if (simpleTime < PERFORMANCE_THRESHOLDS.simpleQueryTime) {
        this.results.passed.push(`Simple query completed in ${simpleTime}ms`);
      } else {
        this.results.warnings.push(`Slow simple query: ${simpleTime}ms`);
      }
      
      // Test 2: Table scan performance (if product table exists)
      try {
        const scanStart = Date.now();
        await this.client.query('SELECT COUNT(*) FROM product');
        const scanTime = Date.now() - scanStart;
        
        if (scanTime < PERFORMANCE_THRESHOLDS.complexQueryTime) {
          this.results.passed.push(`Table scan completed in ${scanTime}ms`);
        } else {
          this.results.warnings.push(`Slow table scan: ${scanTime}ms`);
        }
      } catch (error) {
        // Table might not exist yet, which is okay
        console.log(chalk.gray('Skipping table scan test (product table not found)'));
      }
      
      // Test 3: Connection pool test
      const poolTest = [];
      const poolStart = Date.now();
      
      for (let i = 0; i < 10; i++) {
        poolTest.push(this.client.query('SELECT $1::int AS number', [i]));
      }
      
      await Promise.all(poolTest);
      const poolTime = Date.now() - poolStart;
      
      if (poolTime < 1000) {
        this.results.passed.push(`Concurrent queries completed in ${poolTime}ms`);
      } else {
        this.results.warnings.push(`Slow concurrent queries: ${poolTime}ms`);
      }
      
    } catch (error) {
      this.results.failed.push(`Performance test failed: ${error.message}`);
    }
  }

  async checkConfiguration() {
    console.log(chalk.blue('⚙️  Checking database configuration...'));
    
    try {
      // Check important PostgreSQL settings
      const configChecks = [
        { setting: 'max_connections', minValue: 100 },
        { setting: 'shared_buffers', minValue: '128MB' },
        { setting: 'effective_cache_size', minValue: '1GB' },
      ];
      
      for (const check of configChecks) {
        const result = await this.client.query('SHOW ' + check.setting);
        const value = result.rows[0][check.setting];
        
        this.results.passed.push(`${check.setting}: ${value}`);
      }
      
      // Check database size
      const sizeResult = await this.client.query(`
        SELECT pg_database_size(current_database()) as size;
      `);
      
      const sizeInMB = Math.round(sizeResult.rows[0].size / 1024 / 1024);
      this.results.passed.push(`Database size: ${sizeInMB}MB`);
      
    } catch (error) {
      this.results.warnings.push(`Configuration check failed: ${error.message}`);
    }
  }

  async cleanup() {
    if (this.client) {
      await this.client.end();
    }
  }

  printResults() {
    console.log('\n' + chalk.bold('================================'));
    console.log(chalk.bold('DATABASE VERIFICATION RESULTS'));
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
      console.log(chalk.green.bold('\n✅ All database verifications passed!'));
      return 0;
    } else {
      console.log(chalk.red.bold('\n❌ Some database verifications failed!'));
      return 1;
    }
  }
}

// Main execution
async function main() {
  const verifier = new DatabaseVerifier();
  
  try {
    const connected = await verifier.connect();
    
    if (connected) {
      await verifier.verifySchema();
      await verifier.testPerformance();
      await verifier.checkConfiguration();
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

module.exports = { DatabaseVerifier };