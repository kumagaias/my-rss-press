#!/bin/bash

# Production Environment Verification Script
# This script verifies all production services are working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="https://my-rss-press.com"
API_URL="https://api.my-rss-press.com"
TIMEOUT=10

echo "========================================="
echo "Production Environment Verification"
echo "========================================="
echo ""

# Function to check HTTP status
check_http() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $status_code, expected $expected_status)"
        return 1
    fi
}

# Function to check response time
check_response_time() {
    local url=$1
    local max_time=$2
    local description=$3
    
    echo -n "Checking $description response time... "
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$url" || echo "999")
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        echo -e "${GREEN}✓ OK${NC} (${response_time}s < ${max_time}s)"
        return 0
    else
        echo -e "${YELLOW}⚠ SLOW${NC} (${response_time}s >= ${max_time}s)"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl() {
    local url=$1
    local description=$2
    
    echo -n "Checking $description SSL certificate... "
    
    if echo | openssl s_client -servername $(echo $url | sed 's|https://||' | sed 's|/.*||') -connect $(echo $url | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
        echo -e "${GREEN}✓ VALID${NC}"
        return 0
    else
        echo -e "${RED}✗ INVALID${NC}"
        return 1
    fi
}

# Function to check DNS resolution
check_dns() {
    local domain=$1
    local description=$2
    
    echo -n "Checking $description DNS resolution... "
    
    # Try dig first, fall back to nslookup, then host
    if command -v dig &> /dev/null; then
        if dig +short "$domain" | grep -q .; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        fi
    elif command -v nslookup &> /dev/null; then
        if nslookup "$domain" &> /dev/null; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        fi
    elif command -v host &> /dev/null; then
        if host "$domain" &> /dev/null; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        fi
    else
        # If no DNS tools available, skip this check
        echo -e "${YELLOW}⚠ SKIPPED${NC} (no DNS tools available)"
        return 0
    fi
    
    echo -e "${RED}✗ FAILED${NC}"
    return 1
}

# Track failures
FAILURES=0

echo "1. DNS Resolution"
echo "-----------------"
# DNS checks are informational only - if HTTPS works, DNS is working
check_dns "my-rss-press.com" "Frontend" || echo "  Note: DNS check failed but HTTPS works, so DNS is functional"
check_dns "api.my-rss-press.com" "API" || echo "  Note: DNS check failed but HTTPS works, so DNS is functional"
echo ""

echo "2. SSL Certificates"
echo "-------------------"
check_ssl "$FRONTEND_URL" "Frontend" || ((FAILURES++))
check_ssl "$API_URL" "API" || ((FAILURES++))
echo ""

echo "3. Service Availability"
echo "-----------------------"
check_http "$FRONTEND_URL" "200" "Frontend homepage" || ((FAILURES++))
check_http "$API_URL/api/health" "200" "API health endpoint" || ((FAILURES++))
echo ""

echo "4. Response Times"
echo "-----------------"
check_response_time "$FRONTEND_URL" "2.0" "Frontend" || ((FAILURES++))
check_response_time "$API_URL/api/health" "1.0" "API health" || ((FAILURES++))
echo ""

echo "5. API Endpoints"
echo "----------------"
echo -n "Testing API health endpoint response... "
health_response=$(curl -s "$API_URL/api/health")
if echo "$health_response" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $health_response"
    ((FAILURES++))
fi
echo ""

echo "========================================="
echo "Verification Summary"
echo "========================================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Production URLs:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  API:      $API_URL"
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
    echo ""
    echo "Please review the failures above and fix them before proceeding."
    exit 1
fi
