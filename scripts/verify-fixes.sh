#!/bin/bash

# Quick verification script for critical fixes
# Run after each step to ensure success

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Verifying Critical Fixes"
echo "=========================="

# Track results
FIXES_OK=0
FIXES_FAILED=0

# Check function
check_fix() {
    local name=$1
    local command=$2
    local expected=$3
    
    echo -n "Checking $name... "
    
    result=$(eval $command 2>&1 || echo "FAILED")
    
    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ FIXED${NC}"
        ((FIXES_OK++))
    else
        echo -e "${RED}❌ NOT FIXED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FIXES_FAILED++))
    fi
}

# 1. Check Redis URL
check_fix "Redis URL has ?family=0" \
    "grep REDIS_URL backend/.env 2>/dev/null || echo 'NOT FOUND'" \
    "?family=0"

# 2. Check package.json overrides
check_fix "@swc/core override" \
    "grep -A2 overrides backend/package.json 2>/dev/null || echo 'NOT FOUND'" \
    "1.3.96"

# 3. Check database config exists
check_fix "Database config file" \
    "[ -f backend/src/utils/database-config.ts ] && echo 'EXISTS' || echo 'NOT FOUND'" \
    "EXISTS"

# 4. Check health endpoint
if [ -f "backend/src/api/monitoring/route.ts" ] || [ -f "backend/src/api/health/route.ts" ]; then
    echo -e "Health endpoint... ${GREEN}✅ EXISTS${NC}"
    ((FIXES_OK++))
else
    echo -e "Health endpoint... ${RED}❌ NOT FOUND${NC}"
    ((FIXES_FAILED++))
fi

# 5. Check node_modules (if reinstalled)
if [ -d "backend/node_modules/@swc/core" ]; then
    SWC_VERSION=$(cd backend && npm list @swc/core 2>/dev/null | grep @swc/core | head -1 || echo "unknown")
    echo -e "@swc/core installed version... ${YELLOW}$SWC_VERSION${NC}"
fi

# 6. Check env validation script
check_fix "Environment validation" \
    "[ -f backend/src/scripts/startup-check.ts ] && echo 'EXISTS' || echo 'NOT FOUND'" \
    "EXISTS"

# Summary
echo ""
echo "=========================="
echo -e "${BLUE}Summary:${NC}"
echo -e "Fixes Applied: ${GREEN}$FIXES_OK${NC}"
echo -e "Fixes Missing: ${RED}$FIXES_FAILED${NC}"
echo ""

if [ $FIXES_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical fixes are in place!${NC}"
    echo "You're ready to deploy!"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some fixes are missing. Please complete all steps.${NC}"
    exit 1
fi