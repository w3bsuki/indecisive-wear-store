#!/bin/bash

# Comprehensive Test Runner Script
# This script orchestrates all tests and verifications

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✓ $1")
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("✗ $1")
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check yarn
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn is not installed"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Clean up existing test environment
cleanup_test_env() {
    log_info "Cleaning up test environment..."
    
    # Stop and remove test containers
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
    
    # Remove test volumes
    docker volume rm testing_test-db-data 2>/dev/null || true
    docker volume rm testing_prometheus-data 2>/dev/null || true
    docker volume rm testing_grafana-data 2>/dev/null || true
    
    log_success "Test environment cleaned up"
}

# Start test infrastructure
start_test_infrastructure() {
    log_info "Starting test infrastructure..."
    
    # Start only database and redis first
    docker-compose -f docker-compose.test.yml up -d test-postgres test-redis
    
    # Wait for services to be healthy
    log_info "Waiting for test database to be ready..."
    sleep 10
    
    # Verify database is accessible
    docker exec $(docker-compose -f docker-compose.test.yml ps -q test-postgres) \
        pg_isready -U test_user -d test_medusa_db
    
    if [ $? -eq 0 ]; then
        log_success "Test database is ready"
    else
        log_error "Test database failed to start"
        return 1
    fi
    
    # Verify Redis is accessible
    docker exec $(docker-compose -f docker-compose.test.yml ps -q test-redis) \
        redis-cli ping > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Test Redis is ready"
    else
        log_error "Test Redis failed to start"
        return 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd ../backend
    
    # Set test environment variables
    export DATABASE_URL="postgres://test_user:test_password@localhost:5434/test_medusa_db?sslmode=disable"
    export NODE_ENV="test"
    
    # Run migrations
    yarn medusa db:migrate
    
    if [ $? -eq 0 ]; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        return 1
    fi
    
    cd ../testing
}

# Test 1: Database Connection and Schema
test_database_connection() {
    log_info "Testing database connection and schema..."
    
    # Test connection
    docker exec $(docker-compose -f docker-compose.test.yml ps -q test-postgres) \
        psql -U test_user -d test_medusa_db -c "SELECT version();" > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Database connection test passed"
    else
        log_error "Database connection test failed"
        return 1
    fi
    
    # Verify critical tables exist
    TABLES=("product" "cart" "customer" "order" "payment" "store")
    
    for table in "${TABLES[@]}"; do
        docker exec $(docker-compose -f docker-compose.test.yml ps -q test-postgres) \
            psql -U test_user -d test_medusa_db -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            log_success "Table '$table' exists"
        else
            log_warning "Table '$table' not found (might be created later)"
        fi
    done
}

# Test 2: Redis Connection
test_redis_connection() {
    log_info "Testing Redis connection..."
    
    # Test basic operations
    docker exec $(docker-compose -f docker-compose.test.yml ps -q test-redis) \
        redis-cli SET test_key "test_value" > /dev/null
    
    VALUE=$(docker exec $(docker-compose -f docker-compose.test.yml ps -q test-redis) \
        redis-cli GET test_key)
    
    if [ "$VALUE" = "test_value" ]; then
        log_success "Redis connection and operations test passed"
    else
        log_error "Redis test failed"
        return 1
    fi
    
    # Clean up test key
    docker exec $(docker-compose -f docker-compose.test.yml ps -q test-redis) \
        redis-cli DEL test_key > /dev/null
}

# Test 3: Backend API Health
test_backend_health() {
    log_info "Starting backend and testing health endpoints..."
    
    # Start backend service
    docker-compose -f docker-compose.test.yml up -d test-medusa
    
    # Wait for backend to be ready (max 2 minutes)
    TIMEOUT=120
    ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if curl -s http://localhost:9001/health > /dev/null 2>&1; then
            log_success "Backend is responding"
            break
        fi
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        log_info "Waiting for backend to start... ($ELAPSED/$TIMEOUT seconds)"
    done
    
    if [ $ELAPSED -ge $TIMEOUT ]; then
        log_error "Backend failed to start within timeout"
        return 1
    fi
    
    # Test health endpoint
    HEALTH_RESPONSE=$(curl -s http://localhost:9001/health)
    
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        echo "Response: $HEALTH_RESPONSE"
        return 1
    fi
    
    # Test monitoring endpoint
    MONITORING_RESPONSE=$(curl -s http://localhost:9001/monitoring)
    
    if echo "$MONITORING_RESPONSE" | grep -q '"services"'; then
        log_success "Monitoring endpoint test passed"
    else
        log_error "Monitoring endpoint test failed"
        return 1
    fi
}

# Test 4: API Rate Limiting
test_rate_limiting() {
    log_info "Testing API rate limiting..."
    
    # Send multiple requests quickly
    RATE_LIMIT_HIT=false
    
    for i in {1..20}; do
        RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:9001/store/products)
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "429" ]; then
            RATE_LIMIT_HIT=true
            break
        fi
    done
    
    if [ "$RATE_LIMIT_HIT" = true ]; then
        log_success "Rate limiting is working"
    else
        log_warning "Rate limiting might not be configured (not critical)"
    fi
}

# Test 5: Frontend Build and Start
test_frontend() {
    log_info "Testing frontend build and start..."
    
    # Start frontend service
    docker-compose -f docker-compose.test.yml up -d test-frontend
    
    # Wait for frontend to be ready
    TIMEOUT=180
    ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            log_success "Frontend is responding"
            break
        fi
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        log_info "Waiting for frontend to start... ($ELAPSED/$TIMEOUT seconds)"
    done
    
    if [ $ELAPSED -ge $TIMEOUT ]; then
        log_error "Frontend failed to start within timeout"
        return 1
    fi
    
    # Test critical pages
    PAGES=("/" "/products" "/cart")
    
    for page in "${PAGES[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001$page)
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_success "Page $page is accessible"
        else
            log_error "Page $page returned $HTTP_CODE"
        fi
    done
}

# Test 6: Cart Functionality
test_cart_functionality() {
    log_info "Testing cart functionality..."
    
    # First, we need to create a cart
    CART_RESPONSE=$(curl -s -X POST http://localhost:9001/store/carts \
        -H "Content-Type: application/json")
    
    CART_ID=$(echo "$CART_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$CART_ID" ]; then
        log_success "Cart created successfully: $CART_ID"
    else
        log_error "Failed to create cart"
        return 1
    fi
    
    # Test cart retrieval
    CART_GET_RESPONSE=$(curl -s http://localhost:9001/store/carts/$CART_ID)
    
    if echo "$CART_GET_RESPONSE" | grep -q "$CART_ID"; then
        log_success "Cart retrieval test passed"
    else
        log_error "Cart retrieval test failed"
    fi
}

# Test 7: Security Headers
test_security_headers() {
    log_info "Testing security headers..."
    
    # Test backend security headers
    HEADERS=$(curl -s -I http://localhost:9001/health)
    
    # Check for critical security headers
    SECURITY_HEADERS=(
        "X-Content-Type-Options: nosniff"
        "X-Frame-Options: DENY"
        "X-XSS-Protection: 1; mode=block"
    )
    
    for header in "${SECURITY_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -q "$header"; then
            log_success "Security header present: $header"
        else
            log_warning "Security header missing: $header"
        fi
    done
}

# Test 8: Performance Benchmarks
test_performance() {
    log_info "Running performance benchmarks..."
    
    # Test health endpoint response time
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:9001/health)
    
    if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
        log_success "Health endpoint response time: ${RESPONSE_TIME}s (< 0.5s)"
    else
        log_warning "Health endpoint response time: ${RESPONSE_TIME}s (> 0.5s)"
    fi
    
    # Test products endpoint response time
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:9001/store/products)
    
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        log_success "Products endpoint response time: ${RESPONSE_TIME}s (< 2s)"
    else
        log_warning "Products endpoint response time: ${RESPONSE_TIME}s (> 2s)"
    fi
}

# Test 9: Error Handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test 404 handling
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9001/nonexistent-endpoint)
    
    if [ "$HTTP_CODE" = "404" ]; then
        log_success "404 error handling works correctly"
    else
        log_error "404 error handling failed (returned $HTTP_CODE)"
    fi
    
    # Test invalid cart ID
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9001/store/carts/invalid-id)
    
    if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "400" ]; then
        log_success "Invalid resource handling works correctly"
    else
        log_error "Invalid resource handling failed (returned $HTTP_CODE)"
    fi
}

# Run load tests
run_load_tests() {
    log_info "Running load tests..."
    
    if [ -f "./load-tests/basic-load-test.js" ]; then
        docker-compose -f docker-compose.test.yml --profile load-test run --rm load-tester \
            run /scripts/basic-load-test.js
    else
        log_warning "Load test script not found, skipping..."
    fi
}

# Generate test report
generate_report() {
    log_info "Generating test report..."
    
    REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "================================"
        echo "TEST EXECUTION REPORT"
        echo "================================"
        echo "Date: $(date)"
        echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
        echo "Passed: $TESTS_PASSED"
        echo "Failed: $TESTS_FAILED"
        echo ""
        echo "Test Results:"
        echo "--------------------------------"
        for result in "${TEST_RESULTS[@]}"; do
            echo "$result"
        done
        echo "================================"
    } > "$REPORT_FILE"
    
    cat "$REPORT_FILE"
    log_info "Report saved to: $REPORT_FILE"
}

# Main execution
main() {
    log_info "Starting comprehensive test suite..."
    
    # Run all tests
    check_prerequisites
    cleanup_test_env
    start_test_infrastructure
    run_migrations
    test_database_connection
    test_redis_connection
    test_backend_health
    test_rate_limiting
    test_frontend
    test_cart_functionality
    test_security_headers
    test_performance
    test_error_handling
    
    # Optional: Run load tests
    if [ "$1" = "--with-load-tests" ]; then
        run_load_tests
    fi
    
    # Generate report
    generate_report
    
    # Cleanup if all tests passed
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed!"
        if [ "$1" != "--keep-running" ]; then
            cleanup_test_env
        fi
        exit 0
    else
        log_error "Some tests failed!"
        exit 1
    fi
}

# Handle interrupts
trap cleanup_test_env INT TERM

# Run main
main "$@"