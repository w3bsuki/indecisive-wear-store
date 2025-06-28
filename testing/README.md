# Testing and Verification Suite

This directory contains comprehensive testing and verification tools for the Indecisive Wear Store deployment.

## Quick Start

1. **Run basic health checks:**
   ```bash
   ./health-check-validation.sh
   ```

2. **Run automated test suite:**
   ```bash
   ./automated-tests.sh --quick  # Quick tests only
   ./automated-tests.sh --full   # All tests including load tests
   ```

3. **Run specific verification:**
   ```bash
   node verification-scripts/verify-database.js
   node verification-scripts/verify-api.js
   node verification-scripts/verify-frontend.js
   ```

## Directory Structure

```
testing/
├── docker-compose.test.yml      # Test environment configuration
├── test-runner.sh              # Main test orchestration script
├── automated-tests.sh          # Automated test suite runner
├── health-check-validation.sh  # System health validation
├── rollback-procedures.md      # Rollback documentation
├── error-scenarios.md          # Common errors and solutions
├── verification-scripts/       # Individual verification scripts
│   ├── verify-database.js
│   ├── verify-api.js
│   └── verify-frontend.js
├── load-tests/                 # K6 load testing scripts
│   ├── basic-load-test.js
│   └── stress-test.js
├── monitoring/                 # Monitoring configuration
│   └── prometheus.yml
└── performance-benchmark.js    # Performance measurement tool
```

## Test Types

### 1. Health Checks
- Database connectivity and schema validation
- Redis connection and memory usage
- API endpoint availability
- Frontend accessibility
- Security headers validation

### 2. Integration Tests
- Cart creation and management
- Product browsing flows
- Authentication workflows
- Frontend-backend communication

### 3. Performance Tests
- Response time benchmarks
- Concurrent request handling
- Memory usage monitoring
- Cache effectiveness

### 4. Load Tests
- Basic load test (up to 100 users)
- Stress test (up to 400 users)
- Sustained load scenarios

## Usage Examples

### Running Tests in Docker

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run all tests
./test-runner.sh

# Keep environment running after tests
./test-runner.sh --keep-running

# Run with load tests
./test-runner.sh --with-load-tests
```

### Verifying Specific Components

```bash
# Database only
DATABASE_URL=postgres://user:pass@localhost:5432/db node verification-scripts/verify-database.js

# API with custom URL
API_URL=http://localhost:9001 node verification-scripts/verify-api.js

# Frontend with Puppeteer
FRONTEND_URL=http://localhost:3001 node verification-scripts/verify-frontend.js
```

### Performance Benchmarking

```bash
# Run performance benchmarks
node performance-benchmark.js

# Run load test
docker-compose -f docker-compose.test.yml --profile load-test run load-tester \
  run /scripts/basic-load-test.js

# Run stress test
docker-compose -f docker-compose.test.yml --profile load-test run load-tester \
  run /scripts/stress-test.js
```

## Expected Outputs

### Successful Test Run
```
✅ All tests passed!
Total Tests: 45
Passed: 45
Failed: 0
Success Rate: 100%
```

### Health Check Output
```
=== Database Health Checks ===
✓ PostgreSQL Connection
✓ Database Exists
✓ Table: product
✓ Table: cart
Active Connections: 12
✓ Connection pool healthy

Health Score: 95.2%
```

### Performance Benchmark
```
✓ Health Endpoint: 45.23ms (threshold: 100ms)
✓ Products Listing: 234.56ms (threshold: 500ms)
✓ Cart Creation: 156.78ms (threshold: 300ms)
Performance Score: 92.5%
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Use different ports in docker-compose.test.yml
   ports:
     - "9001:9000"  # Instead of 9000:9000
   ```

2. **Memory issues:**
   ```bash
   # Increase Docker memory allocation
   docker system prune -a
   ```

3. **Test timeouts:**
   ```bash
   # Increase timeout in test scripts
   export TEST_TIMEOUT=300000  # 5 minutes
   ```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    cd testing
    ./automated-tests.sh --full
```

## Monitoring Integration

The test suite can export metrics to Prometheus:

```bash
# Start monitoring stack
docker-compose -f docker-compose.test.yml --profile monitoring up -d

# Access Grafana
open http://localhost:3002
```

## Best Practices

1. **Always run health checks first** to ensure services are ready
2. **Use --quick flag** for rapid feedback during development
3. **Run full suite** before production deployments
4. **Monitor trends** in performance benchmarks over time
5. **Document failures** in error-scenarios.md

## Emergency Procedures

If tests reveal critical issues:

1. Check `rollback-procedures.md` for rollback steps
2. Review `error-scenarios.md` for solutions
3. Use emergency recovery script:
   ```bash
   ./emergency-recovery.sh
   ```

Remember: A comprehensive test suite is your safety net for confident deployments!