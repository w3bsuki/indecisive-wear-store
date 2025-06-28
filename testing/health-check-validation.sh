#!/bin/bash

# Health Check Validation Script
# Comprehensive health checks for all system components

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:9000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Health check results
declare -A HEALTH_STATUS
HEALTH_CHECKS_PASSED=0
HEALTH_CHECKS_FAILED=0

# Helper functions
check_health() {
    local component=$1
    local check_command=$2
    local expected_result=$3
    
    echo -ne "${BLUE}Checking $component...${NC} "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        HEALTH_STATUS["$component"]="HEALTHY"
        HEALTH_CHECKS_PASSED=$((HEALTH_CHECKS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        HEALTH_STATUS["$component"]="UNHEALTHY"
        HEALTH_CHECKS_FAILED=$((HEALTH_CHECKS_FAILED + 1))
        return 1
    fi
}

# 1. Database Health Checks
check_database_health() {
    echo -e "\n${BLUE}=== Database Health Checks ===${NC}"
    
    # Check PostgreSQL connectivity
    check_health "PostgreSQL Connection" \
        "pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U postgres" \
        "accepting connections"
    
    # Check database exists
    check_health "Database Exists" \
        "docker exec postgres psql -U postgres -lqt | grep -q medusa-db" \
        "medusa-db"
    
    # Check critical tables
    local tables=("product" "cart" "customer" "\"order\"" "store")
    for table in "${tables[@]}"; do
        check_health "Table: $table" \
            "docker exec postgres psql -U postgres -d medusa-db -c \"SELECT 1 FROM $table LIMIT 1;\"" \
            "1"
    done
    
    # Check connection pool
    local active_connections=$(docker exec postgres psql -U postgres -d medusa-db -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'medusa-db';")
    echo -e "${BLUE}Active Connections:${NC} $active_connections"
    
    if [ "$active_connections" -lt 100 ]; then
        echo -e "${GREEN}✓ Connection pool healthy${NC}"
    else
        echo -e "${YELLOW}⚠ High connection count${NC}"
    fi
}

# 2. Redis Health Checks
check_redis_health() {
    echo -e "\n${BLUE}=== Redis Health Checks ===${NC}"
    
    # Check Redis connectivity
    check_health "Redis Connection" \
        "redis-cli -h $REDIS_HOST -p $REDIS_PORT ping | grep -q PONG" \
        "PONG"
    
    # Check Redis memory
    local used_memory=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    echo -e "${BLUE}Redis Memory Usage:${NC} $used_memory"
    
    # Check Redis persistence
    check_health "Redis Persistence" \
        "redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG GET save | grep -q save" \
        "save"
}

# 3. Backend API Health Checks
check_backend_health() {
    echo -e "\n${BLUE}=== Backend API Health Checks ===${NC}"
    
    # Basic health endpoint
    check_health "Health Endpoint" \
        "curl -f -s $API_URL/health | grep -q '\"status\":\"healthy\"'" \
        "healthy"
    
    # Monitoring endpoint
    check_health "Monitoring Endpoint" \
        "curl -f -s $API_URL/monitoring | grep -q '\"services\"'" \
        "services"
    
    # Store endpoints
    local endpoints=("/store/products" "/store/regions" "/store/currencies")
    for endpoint in "${endpoints[@]}"; do
        check_health "Endpoint: $endpoint" \
            "curl -f -s -o /dev/null -w '%{http_code}' $API_URL$endpoint | grep -q 200" \
            "200"
    done
    
    # Response time check
    local response_time=$(curl -s -o /dev/null -w '%{time_total}' $API_URL/health)
    echo -e "${BLUE}Health endpoint response time:${NC} ${response_time}s"
    
    if (( $(echo "$response_time < 0.5" | bc -l) )); then
        echo -e "${GREEN}✓ Response time acceptable${NC}"
    else
        echo -e "${YELLOW}⚠ Slow response time${NC}"
    fi
}

# 4. Frontend Health Checks
check_frontend_health() {
    echo -e "\n${BLUE}=== Frontend Health Checks ===${NC}"
    
    # Check if frontend is accessible
    check_health "Frontend Homepage" \
        "curl -f -s -o /dev/null -w '%{http_code}' $FRONTEND_URL | grep -q 200" \
        "200"
    
    # Check critical pages
    local pages=("/products" "/cart" "/about")
    for page in "${pages[@]}"; do
        check_health "Page: $page" \
            "curl -f -s -o /dev/null -w '%{http_code}' $FRONTEND_URL$page | grep -q 200" \
            "200"
    done
    
    # Check static assets
    check_health "Static Assets" \
        "curl -f -s $FRONTEND_URL/_next/static/css/ -I | grep -q 200" \
        "200"
}

# 5. Integration Health Checks
check_integration_health() {
    echo -e "\n${BLUE}=== Integration Health Checks ===${NC}"
    
    # Check frontend can reach backend
    check_health "Frontend-Backend Connection" \
        "curl -s $FRONTEND_URL | grep -q 'data-backend-url'" \
        "backend-url"
    
    # Check cart creation flow
    local cart_response=$(curl -s -X POST $API_URL/store/carts -H "Content-Type: application/json" -d '{}')
    if echo "$cart_response" | grep -q '"id"'; then
        echo -e "${GREEN}✓ Cart creation working${NC}"
        HEALTH_CHECKS_PASSED=$((HEALTH_CHECKS_PASSED + 1))
        
        # Extract cart ID and test retrieval
        local cart_id=$(echo "$cart_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        check_health "Cart Retrieval" \
            "curl -f -s $API_URL/store/carts/$cart_id | grep -q $cart_id" \
            "$cart_id"
    else
        echo -e "${RED}✗ Cart creation failed${NC}"
        HEALTH_CHECKS_FAILED=$((HEALTH_CHECKS_FAILED + 1))
    fi
}

# 6. Security Health Checks
check_security_health() {
    echo -e "\n${BLUE}=== Security Health Checks ===${NC}"
    
    # Check security headers
    local headers=$(curl -s -I $API_URL/health)
    
    local security_headers=(
        "X-Content-Type-Options: nosniff"
        "X-Frame-Options: DENY"
        "X-XSS-Protection: 1; mode=block"
    )
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -q "$header"; then
            echo -e "${GREEN}✓ $header${NC}"
            HEALTH_CHECKS_PASSED=$((HEALTH_CHECKS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠ Missing: $header${NC}"
        fi
    done
    
    # Check CORS configuration
    local cors_test=$(curl -s -I -H "Origin: $FRONTEND_URL" $API_URL/store/products)
    if echo "$cors_test" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✓ CORS configured${NC}"
        HEALTH_CHECKS_PASSED=$((HEALTH_CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ CORS not configured${NC}"
        HEALTH_CHECKS_FAILED=$((HEALTH_CHECKS_FAILED + 1))
    fi
}

# 7. Performance Health Checks
check_performance_health() {
    echo -e "\n${BLUE}=== Performance Health Checks ===${NC}"
    
    # CPU usage check
    local cpu_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep medusa | awk '{print $2}' | tr -d '%')
    echo -e "${BLUE}Backend CPU Usage:${NC} ${cpu_usage}%"
    
    if (( $(echo "$cpu_usage < 80" | bc -l) )); then
        echo -e "${GREEN}✓ CPU usage acceptable${NC}"
    else
        echo -e "${YELLOW}⚠ High CPU usage${NC}"
    fi
    
    # Memory usage check
    local mem_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemPerc}}" | grep medusa | awk '{print $2}' | tr -d '%')
    echo -e "${BLUE}Backend Memory Usage:${NC} ${mem_usage}%"
    
    if (( $(echo "$mem_usage < 80" | bc -l) )); then
        echo -e "${GREEN}✓ Memory usage acceptable${NC}"
    else
        echo -e "${YELLOW}⚠ High memory usage${NC}"
    fi
}

# Generate health report
generate_health_report() {
    local report_file="health-check-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "summary": {
    "total_checks": $((HEALTH_CHECKS_PASSED + HEALTH_CHECKS_FAILED)),
    "passed": $HEALTH_CHECKS_PASSED,
    "failed": $HEALTH_CHECKS_FAILED,
    "health_score": $(echo "scale=2; $HEALTH_CHECKS_PASSED / ($HEALTH_CHECKS_PASSED + $HEALTH_CHECKS_FAILED) * 100" | bc)
  },
  "components": {
EOF

    local first=true
    for component in "${!HEALTH_STATUS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        echo -n "    \"$component\": \"${HEALTH_STATUS[$component]}\"" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

  }
}
EOF

    echo -e "\n${BLUE}Health report saved to:${NC} $report_file"
}

# Main execution
main() {
    echo "========================================="
    echo "SYSTEM HEALTH CHECK VALIDATION"
    echo "========================================="
    echo "Timestamp: $(date)"
    
    # Run all health checks
    check_database_health
    check_redis_health
    check_backend_health
    check_frontend_health
    check_integration_health
    check_security_health
    check_performance_health
    
    # Summary
    echo -e "\n${BLUE}=========================================${NC}"
    echo -e "${BLUE}HEALTH CHECK SUMMARY${NC}"
    echo -e "${BLUE}=========================================${NC}"
    
    local total_checks=$((HEALTH_CHECKS_PASSED + HEALTH_CHECKS_FAILED))
    local health_percentage=$(echo "scale=2; $HEALTH_CHECKS_PASSED / $total_checks * 100" | bc)
    
    echo -e "Total Checks: $total_checks"
    echo -e "Passed: ${GREEN}$HEALTH_CHECKS_PASSED${NC}"
    echo -e "Failed: ${RED}$HEALTH_CHECKS_FAILED${NC}"
    echo -e "Health Score: ${health_percentage}%"
    
    # Generate report
    generate_health_report
    
    # Exit code based on health
    if [ $HEALTH_CHECKS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✅ All health checks passed!${NC}"
        exit 0
    elif [ $HEALTH_CHECKS_FAILED -lt 3 ]; then
        echo -e "\n${YELLOW}⚠️  System is operational with warnings${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ System health is critical!${NC}"
        exit 1
    fi
}

# Run main
main "$@"