#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏥 Indecisive Wear - System Health Check${NC}"
echo "================================================"

# Variables for tracking overall health
HEALTH_STATUS=0
SERVICES_CHECKED=0
SERVICES_HEALTHY=0

# Function to check service health
check_service() {
    local service_name=$1
    local check_command=$2
    local service_url=$3
    
    SERVICES_CHECKED=$((SERVICES_CHECKED + 1))
    
    echo -n "Checking $service_name... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        SERVICES_HEALTHY=$((SERVICES_HEALTHY + 1))
        if [ ! -z "$service_url" ]; then
            echo "  └─ URL: $service_url"
        fi
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        HEALTH_STATUS=1
        return 1
    fi
}

# Function to check port availability
check_port() {
    local port=$1
    local service=$2
    
    echo -n "Checking port $port ($service)... "
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ Open${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Closed${NC}"
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local container_name=$1
    
    echo -n "Checking container $container_name... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        local status=$(docker inspect -f '{{.State.Health.Status}}' $container_name 2>/dev/null)
        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✓ Running (Healthy)${NC}"
        elif [ "$status" = "unhealthy" ]; then
            echo -e "${RED}✗ Running (Unhealthy)${NC}"
            HEALTH_STATUS=1
        else
            echo -e "${YELLOW}⚠ Running (No health check)${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        HEALTH_STATUS=1
        return 1
    fi
}

# Check system requirements
echo -e "${YELLOW}System Requirements:${NC}"
echo -n "Node.js: "
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✓ $(node --version)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

echo -n "Docker: "
if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✓ $(docker --version | cut -d' ' -f3 | sed 's/,$//')${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

echo -n "Docker Compose: "
if command -v docker-compose >/dev/null 2>&1; then
    echo -e "${GREEN}✓ $(docker-compose --version | cut -d' ' -f4)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

echo ""

# Check ports
echo -e "${YELLOW}Port Availability:${NC}"
check_port 3000 "Frontend"
check_port 9000 "Backend"
check_port 5433 "PostgreSQL"
check_port 6379 "Redis"
echo ""

# Check services (if using Docker)
if docker ps >/dev/null 2>&1; then
    echo -e "${YELLOW}Docker Services:${NC}"
    check_container "indecisive-wear-store-main-frontend-1"
    check_container "indecisive-wear-store-main-medusa-1"
    check_container "indecisive-wear-store-main-postgres-1"
    check_container "indecisive-wear-store-main-redis-1"
    echo ""
fi

# Check HTTP services
echo -e "${YELLOW}HTTP Services:${NC}"
check_service "Frontend" "curl -f -s http://localhost:3000" "http://localhost:3000"
check_service "Backend API" "curl -f -s http://localhost:9000/health" "http://localhost:9000"
check_service "Admin Panel" "curl -f -s http://localhost:9000/app" "http://localhost:9000/app"
echo ""

# Check database connectivity
echo -e "${YELLOW}Database Connectivity:${NC}"
if docker ps --format '{{.Names}}' | grep -q postgres; then
    check_service "PostgreSQL" "docker exec indecisive-wear-store-main-postgres-1 pg_isready -U postgres"
else
    echo -e "${YELLOW}⚠ PostgreSQL container not running${NC}"
fi

# Check Redis connectivity
if docker ps --format '{{.Names}}' | grep -q redis; then
    check_service "Redis" "docker exec indecisive-wear-store-main-redis-1 redis-cli ping"
else
    echo -e "${YELLOW}⚠ Redis container not running${NC}"
fi
echo ""

# Performance metrics (if services are running)
if curl -f -s http://localhost:9000/health >/dev/null 2>&1; then
    echo -e "${YELLOW}Performance Metrics:${NC}"
    
    # Backend response time
    echo -n "Backend response time: "
    response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:9000/health)
    response_ms=$(echo "$response_time * 1000" | bc)
    if (( $(echo "$response_ms < 200" | bc -l) )); then
        echo -e "${GREEN}${response_ms}ms ✓${NC}"
    elif (( $(echo "$response_ms < 500" | bc -l) )); then
        echo -e "${YELLOW}${response_ms}ms ⚠${NC}"
    else
        echo -e "${RED}${response_ms}ms ✗${NC}"
    fi
    
    # Memory usage
    if docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" 2>/dev/null | grep -E "(frontend|backend|medusa)"; then
        echo ""
    fi
fi

echo ""

# Environment check
echo -e "${YELLOW}Environment Configuration:${NC}"
if [ -f .env.local ]; then
    echo -e "Development config: ${GREEN}✓ Found${NC}"
else
    echo -e "Development config: ${YELLOW}⚠ Missing${NC}"
fi

if [ -f .env.production ]; then
    echo -e "Production config: ${GREEN}✓ Found${NC}"
else
    echo -e "Production config: ${YELLOW}⚠ Missing${NC}"
fi

echo ""

# Summary
echo "================================================"
echo -e "${BLUE}Health Check Summary:${NC}"
echo "Services checked: $SERVICES_CHECKED"
echo "Services healthy: $SERVICES_HEALTHY"

if [ $HEALTH_STATUS -eq 0 ] && [ $SERVICES_HEALTHY -eq $SERVICES_CHECKED ]; then
    echo -e "${GREEN}Overall Status: ✓ All systems operational${NC}"
else
    echo -e "${RED}Overall Status: ✗ Issues detected${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "1. Check if Docker is running: docker ps"
    echo "2. View logs: docker-compose logs -f [service-name]"
    echo "3. Restart services: docker-compose restart"
    echo "4. Check environment variables: cat .env.local"
fi

echo "================================================"

exit $HEALTH_STATUS