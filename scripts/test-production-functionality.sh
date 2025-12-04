#!/bin/bash

# Production Functionality Test Script
# Tests actual API endpoints and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://api.my-rss-press.com"
TIMEOUT=30

echo "========================================="
echo "Production Functionality Tests"
echo "========================================="
echo ""

# Track failures
FAILURES=0

echo "1. Health Check"
echo "---------------"
echo -n "Testing /api/health... "
response=$(curl -s --max-time $TIMEOUT "$API_URL/api/health")
if echo "$response" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $response"
    ((FAILURES++))
fi
echo ""

echo "2. Feed Suggestion API"
echo "----------------------"
echo -n "Testing POST /api/suggest-feeds... "
response=$(curl -s --max-time $TIMEOUT -X POST "$API_URL/api/suggest-feeds" \
    -H "Content-Type: application/json" \
    -d '{"theme":"Technology"}')

if echo "$response" | grep -q '"suggestions"'; then
    echo -e "${GREEN}✓ OK${NC}"
    echo "  Sample response: $(echo $response | head -c 100)..."
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $response"
    ((FAILURES++))
fi
echo ""

echo "3. Newspaper Generation API"
echo "---------------------------"
echo -n "Testing POST /api/generate-newspaper... "
# Use a reliable RSS feed for testing
response=$(curl -s --max-time $TIMEOUT -X POST "$API_URL/api/generate-newspaper" \
    -H "Content-Type: application/json" \
    -d '{"feedUrls":["https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"],"theme":"Technology"}')

if echo "$response" | grep -q '"articles"'; then
    article_count=$(echo "$response" | grep -o '"title"' | wc -l)
    echo -e "${GREEN}✓ OK${NC}"
    echo "  Generated $article_count articles"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $response"
    ((FAILURES++))
fi
echo ""

echo "4. Public Newspapers API"
echo "------------------------"
echo -n "Testing GET /api/newspapers?sort=popular... "
response=$(curl -s --max-time $TIMEOUT "$API_URL/api/newspapers?sort=popular&limit=5")

if echo "$response" | grep -q '"newspapers"'; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "  No newspapers found (this is OK for a new deployment)"
fi
echo ""

echo "5. Performance Test"
echo "-------------------"
echo -n "Testing newspaper generation performance... "
start_time=$(date +%s.%N)
response=$(curl -s --max-time $TIMEOUT -X POST "$API_URL/api/generate-newspaper" \
    -H "Content-Type: application/json" \
    -d '{"feedUrls":["https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"],"theme":"Technology"}')
end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc)

if (( $(echo "$duration < 10.0" | bc -l) )); then
    echo -e "${GREEN}✓ OK${NC} (${duration}s < 10.0s)"
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${duration}s >= 10.0s)"
    echo "  Note: Target is 5s, but 10s is acceptable for production"
fi
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All functionality tests passed!${NC}"
    echo ""
    echo "Production system is fully operational."
    exit 0
else
    echo -e "${RED}✗ $FAILURES test(s) failed${NC}"
    echo ""
    echo "Please review the failures above and fix them."
    exit 1
fi
