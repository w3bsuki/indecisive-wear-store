#!/bin/bash

# Automated Test Suite Runner
# This script runs all automated tests in sequence

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TEST_RESULTS_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_FILE="$TEST_RESULTS_DIR/automated-test-results-$TIMESTAMP.json"

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Test results storage
declare -A TEST_RESULTS

# Helper functions
log_test_start() {
    echo -e "${BLUE}[TEST START]${NC} $1"
    echo "---"
}

log_test_end() {
    local test_name=$1
    local status=$2
    local duration=$3
    
    TEST_RESULTS["$test_name"]="$status:$duration"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}[PASS]${NC} $test_name completed in ${duration}s"
    else
        echo -e "${RED}[FAIL]${NC} $test_name failed after ${duration}s"
    fi
    echo "---"
    echo
}

# Test 1: Unit Tests
run_unit_tests() {
    log_test_start "Backend Unit Tests"
    local start_time=$(date +%s)
    
    cd ../backend
    if yarn test:unit > "$TEST_RESULTS_DIR/unit-tests-$TIMESTAMP.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Backend Unit Tests" "PASS" "$duration"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Backend Unit Tests" "FAIL" "$duration"
    fi
    cd ../testing
}

# Test 2: Integration Tests
run_integration_tests() {
    log_test_start "Backend Integration Tests"
    local start_time=$(date +%s)
    
    cd ../backend
    if yarn test:integration:http > "$TEST_RESULTS_DIR/integration-http-$TIMESTAMP.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "HTTP Integration Tests" "PASS" "$duration"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "HTTP Integration Tests" "FAIL" "$duration"
    fi
    cd ../testing
}

# Test 3: Database Verification
run_database_tests() {
    log_test_start "Database Verification"
    local start_time=$(date +%s)
    
    # Ensure test database is running
    docker-compose -f docker-compose.test.yml up -d test-postgres
    sleep 10
    
    if node verification-scripts/verify-database.js > "$TEST_RESULTS_DIR/database-verification-$TIMESTAMP.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Database Verification" "PASS" "$duration"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Database Verification" "FAIL" "$duration"
    fi
}

# Test 4: API Verification
run_api_tests() {
    log_test_start "API Verification"
    local start_time=$(date +%s)
    
    # Ensure backend is running
    docker-compose -f docker-compose.test.yml up -d test-medusa
    
    # Wait for backend to be ready
    echo "Waiting for backend to be ready..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if curl -s http://localhost:9001/health > /dev/null 2>&1; then
            break
        fi
        sleep 2
        retries=$((retries + 1))
    done
    
    if node verification-scripts/verify-api.js > "$TEST_RESULTS_DIR/api-verification-$TIMESTAMP.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "API Verification" "PASS" "$duration"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "API Verification" "FAIL" "$duration"
    fi
}

# Test 5: Frontend Tests
run_frontend_tests() {
    log_test_start "Frontend Verification"
    local start_time=$(date +%s)
    
    # Ensure frontend is running
    docker-compose -f docker-compose.test.yml up -d test-frontend
    
    # Wait for frontend
    echo "Waiting for frontend to be ready..."
    local retries=0
    while [ $retries -lt 40 ]; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            break
        fi
        sleep 3
        retries=$((retries + 1))
    done
    
    if node verification-scripts/verify-frontend.js > "$TEST_RESULTS_DIR/frontend-verification-$TIMESTAMP.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Frontend Verification" "PASS" "$duration"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Frontend Verification" "FAIL" "$duration"
    fi
}

# Test 6: Load Tests
run_load_tests() {
    log_test_start "Load Testing"
    local start_time=$(date +%s)
    
    if docker-compose -f docker-compose.test.yml --profile load-test run --rm load-tester \
        run /scripts/basic-load-test.js --out json="$TEST_RESULTS_DIR/load-test-$TIMESTAMP.json" \
        > "$TEST_RESULTS_DIR/load-test-$TIMESTAMP.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Load Testing" "PASS" "$duration"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_test_end "Load Testing" "FAIL" "$duration"
    fi
}

# Test 7: Security Checks
run_security_tests() {
    log_test_start "Security Verification"
    local start_time=$(date +%s)
    
    # Check for security headers
    local security_pass=true
    
    # Test HTTPS redirect (if configured)
    # Test rate limiting
    # Test input validation
    
    # Simple security header check
    if curl -I http://localhost:9001/health 2>/dev/null | grep -q "X-Content-Type-Options: nosniff"; then
        echo "✓ Security headers present"
    else
        echo "✗ Security headers missing"
        security_pass=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ "$security_pass" = true ]; then
        log_test_end "Security Verification" "PASS" "$duration"
    else
        log_test_end "Security Verification" "FAIL" "$duration"
    fi
}

# Generate HTML report
generate_html_report() {
    local report_file="$TEST_RESULTS_DIR/test-report-$TIMESTAMP.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Automated Test Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Automated Test Report</h1>
    <div class="summary">
        <p><strong>Date:</strong> $(date)</p>
        <p><strong>Environment:</strong> Test Environment</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Duration (seconds)</th>
        </tr>
EOF

    for test_name in "${!TEST_RESULTS[@]}"; do
        IFS=':' read -r status duration <<< "${TEST_RESULTS[$test_name]}"
        local status_class=$([ "$status" = "PASS" ] && echo "pass" || echo "fail")
        echo "        <tr>" >> "$report_file"
        echo "            <td>$test_name</td>" >> "$report_file"
        echo "            <td class=\"$status_class\">$status</td>" >> "$report_file"
        echo "            <td>$duration</td>" >> "$report_file"
        echo "        </tr>" >> "$report_file"
    done

    cat >> "$report_file" << EOF
    </table>
    
    <h2>Summary</h2>
    <div class="summary">
        <p><strong>Total Tests:</strong> ${#TEST_RESULTS[@]}</p>
        <p><strong>Passed:</strong> $(grep -o "PASS" <<< "${TEST_RESULTS[@]}" | wc -l)</p>
        <p><strong>Failed:</strong> $(grep -o "FAIL" <<< "${TEST_RESULTS[@]}" | wc -l)</p>
    </div>
</body>
</html>
EOF

    echo "HTML report generated: $report_file"
}

# Main execution
main() {
    echo "========================================="
    echo "AUTOMATED TEST SUITE"
    echo "========================================="
    echo "Started at: $(date)"
    echo
    
    # Check prerequisites
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is required but not installed${NC}"
        exit 1
    fi
    
    # Install test dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing test dependencies..."
        npm install axios chalk puppeteer axe-core pg
    fi
    
    # Run tests based on arguments
    if [ "$1" = "--quick" ]; then
        echo "Running quick test suite..."
        run_unit_tests
        run_database_tests
        run_api_tests
    elif [ "$1" = "--full" ]; then
        echo "Running full test suite..."
        run_unit_tests
        run_integration_tests
        run_database_tests
        run_api_tests
        run_frontend_tests
        run_load_tests
        run_security_tests
    else
        echo "Running standard test suite..."
        run_unit_tests
        run_database_tests
        run_api_tests
        run_frontend_tests
    fi
    
    # Generate reports
    generate_html_report
    
    # Summary
    echo
    echo "========================================="
    echo "TEST SUMMARY"
    echo "========================================="
    
    local total_tests=${#TEST_RESULTS[@]}
    local passed_tests=$(grep -o "PASS" <<< "${TEST_RESULTS[@]}" | wc -l)
    local failed_tests=$(grep -o "FAIL" <<< "${TEST_RESULTS[@]}" | wc -l)
    
    echo "Total Tests: $total_tests"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "\n${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed!${NC}"
        exit 1
    fi
}

# Handle cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up test environment...${NC}"
    docker-compose -f docker-compose.test.yml down -v
}

trap cleanup EXIT

# Run main function
main "$@"