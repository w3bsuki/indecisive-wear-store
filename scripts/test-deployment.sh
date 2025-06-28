#!/bin/bash

# Comprehensive deployment test script
# Tests all critical functionality after deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get backend URL from argument or default
BACKEND_URL=${1:-"http://localhost:9000"}
FRONTEND_URL=${2:-"http://localhost:3000"}

echo -e "${BLUE}🧪 Testing Deployment${NC}"
echo "========================="
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Health Check
echo -e "${YELLOW}1. Health Checks${NC}"
echo "----------------"

run_test "API Health" "curl -f -s $BACKEND_URL/health | jq -e '.status == \"healthy\"'"
run_test "Database Connection" "curl -f -s $BACKEND_URL/health | jq -e '.checks.database.status == \"healthy\"'"
run_test "Admin Panel Access" "curl -f -s -o /dev/null -w '%{http_code}' $BACKEND_URL/admin | grep -q '200'"

# 2. API Endpoints
echo ""
echo -e "${YELLOW}2. API Endpoints${NC}"
echo "----------------"

run_test "Store Products API" "curl -f -s $BACKEND_URL/store/products | jq -e '.products'"
run_test "Store Regions API" "curl -f -s $BACKEND_URL/store/regions | jq -e '.regions'"
run_test "Store Collections API" "curl -f -s $BACKEND_URL/store/collections | jq -e '.collections'"

# 3. Authentication
echo ""
echo -e "${YELLOW}3. Authentication${NC}"
echo "-----------------"

# Create test customer
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="Test123!@#"

CREATE_CUSTOMER=$(curl -s -X POST $BACKEND_URL/store/customers \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"first_name\": \"Test\",
        \"last_name\": \"User\"
    }" 2>/dev/null || echo "{}")

if echo "$CREATE_CUSTOMER" | jq -e '.customer.id' > /dev/null 2>&1; then
    echo -e "Customer Creation... ${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
    
    # Test login
    LOGIN_RESPONSE=$(curl -s -X POST $BACKEND_URL/auth/customer/emailpass \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }" 2>/dev/null || echo "{}")
    
    if echo "$LOGIN_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
        echo -e "Customer Login... ${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "Customer Login... ${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "Customer Creation... ${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# 4. Cart Operations
echo ""
echo -e "${YELLOW}4. Cart Operations${NC}"
echo "------------------"

# Create cart
CART_RESPONSE=$(curl -s -X POST $BACKEND_URL/store/carts \
    -H "Content-Type: application/json" \
    -d '{"region_id": "test"}' 2>/dev/null || echo "{}")

if echo "$CART_RESPONSE" | jq -e '.cart.id' > /dev/null 2>&1; then
    echo -e "Cart Creation... ${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
    CART_ID=$(echo "$CART_RESPONSE" | jq -r '.cart.id')
    
    # Test cart retrieval
    if curl -f -s $BACKEND_URL/store/carts/$CART_ID | jq -e '.cart' > /dev/null 2>&1; then
        echo -e "Cart Retrieval... ${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "Cart Retrieval... ${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "Cart Creation... ${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# 5. Payment Integration
echo ""
echo -e "${YELLOW}5. Payment Integration${NC}"
echo "----------------------"

# Check if Stripe is configured
if curl -s $BACKEND_URL/store/payment-providers | jq -e '.payment_providers[] | select(.id == "stripe")' > /dev/null 2>&1; then
    echo -e "Stripe Provider... ${GREEN}✅ CONFIGURED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Stripe Provider... ${YELLOW}⚠️  NOT CONFIGURED${NC}"
fi

# 6. CORS Headers
echo ""
echo -e "${YELLOW}6. CORS Configuration${NC}"
echo "---------------------"

CORS_RESPONSE=$(curl -s -I -X OPTIONS $BACKEND_URL/store/products \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null || echo "")

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "CORS Headers... ${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "CORS Headers... ${RED}❌ FAILED${NC}"
    echo "  Make sure STORE_CORS includes: $FRONTEND_URL"
    ((TESTS_FAILED++))
fi

# 7. Redis/Worker Check
echo ""
echo -e "${YELLOW}7. Background Jobs${NC}"
echo "------------------"

HEALTH_DATA=$(curl -s $BACKEND_URL/health || echo "{}")
REDIS_STATUS=$(echo "$HEALTH_DATA" | jq -r '.checks.redis.status' 2>/dev/null || echo "unknown")

if [ "$REDIS_STATUS" = "healthy" ]; then
    echo -e "Redis Connection... ${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "Redis Connection... ${YELLOW}⚠️  NOT CONFIGURED${NC}"
    echo "  Background jobs and caching won't work without Redis"
fi

# 8. File Upload Check
echo ""
echo -e "${YELLOW}8. File Storage${NC}"
echo "---------------"

# Create a test file
echo "test" > /tmp/test-upload.txt

UPLOAD_RESPONSE=$(curl -s -X POST $BACKEND_URL/admin/uploads \
    -F "files=@/tmp/test-upload.txt" 2>/dev/null || echo "{}")

if echo "$UPLOAD_RESPONSE" | jq -e '.uploads' > /dev/null 2>&1; then
    echo -e "File Upload... ${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "File Upload... ${YELLOW}⚠️  NEEDS AUTH${NC}"
fi

rm -f /tmp/test-upload.txt

# 9. Performance Check
echo ""
echo -e "${YELLOW}9. Performance${NC}"
echo "--------------"

# Measure API response time
START_TIME=$(date +%s%N)
curl -s $BACKEND_URL/store/products > /dev/null 2>&1
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))

if [ $RESPONSE_TIME -lt 1000 ]; then
    echo -e "API Response Time... ${GREEN}✅ FAST ($RESPONSE_TIME ms)${NC}"
    ((TESTS_PASSED++))
elif [ $RESPONSE_TIME -lt 3000 ]; then
    echo -e "API Response Time... ${YELLOW}⚠️  SLOW ($RESPONSE_TIME ms)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "API Response Time... ${RED}❌ TOO SLOW ($RESPONSE_TIME ms)${NC}"
    ((TESTS_FAILED++))
fi

# Memory usage
MEMORY_USAGE=$(curl -s $BACKEND_URL/health | jq -r '.checks.memory.heapUsed' 2>/dev/null || echo "unknown")
echo -e "Memory Usage... ${BLUE}ℹ️  $MEMORY_USAGE${NC}"

# 10. Security Headers
echo ""
echo -e "${YELLOW}10. Security${NC}"
echo "------------"

SECURITY_HEADERS=$(curl -s -I $BACKEND_URL 2>/dev/null || echo "")

check_header() {
    local header=$1
    local header_name=$2
    
    if echo "$SECURITY_HEADERS" | grep -qi "$header"; then
        echo -e "$header_name... ${GREEN}✅ SET${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "$header_name... ${YELLOW}⚠️  NOT SET${NC}"
    fi
}

check_header "x-frame-options" "X-Frame-Options"
check_header "x-content-type-options" "X-Content-Type-Options"

# Summary
echo ""
echo "========================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "========================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your deployment is working correctly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review the output above for details.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Make sure all environment variables are set correctly"
    echo "2. Check that Redis URL includes ?family=0"
    echo "3. Ensure CORS settings include your frontend URL"
    echo "4. Run database migrations: railway run yarn medusa db:migrate"
    echo "5. Check logs: railway logs --tail"
    exit 1
fi