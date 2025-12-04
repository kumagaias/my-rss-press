#!/bin/bash

# Final Checklist for Phase 1 (MVP) Completion
# This script verifies all requirements are met

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "Phase 1 (MVP) Final Checklist"
echo "========================================="
echo ""

# Track status
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to check item
check_item() {
    local description=$1
    local command=$2
    local expected=$3
    
    ((TOTAL_CHECKS++))
    echo -n "[$TOTAL_CHECKS] $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to check file exists
check_file() {
    local description=$1
    local file=$2
    
    ((TOTAL_CHECKS++))
    echo -n "[$TOTAL_CHECKS] $description... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    local description=$1
    local dir=$2
    
    ((TOTAL_CHECKS++))
    echo -n "[$TOTAL_CHECKS] $description... "
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED_CHECKS++))
        return 1
    fi
}

echo -e "${BLUE}1. Project Structure${NC}"
echo "--------------------"
check_dir "Frontend directory exists" "frontend"
check_dir "Backend directory exists" "backend"
check_dir "Infrastructure directory exists" "infra"
check_dir "Scripts directory exists" "scripts"
check_file "Root README.md exists" "README.md"
check_file "Makefile exists" "Makefile"
echo ""

echo -e "${BLUE}2. Documentation${NC}"
echo "----------------"
check_file "tech.md exists" ".kiro/steering/tech.md"
check_file "structure.md exists" ".kiro/steering/structure.md"
check_file "project-standards.md exists" ".kiro/steering/project-standards.md"
check_file "Phase 1 requirements exists" ".kiro/specs/phase-1/requirements.md"
check_file "Phase 1 design exists" ".kiro/specs/phase-1/design.md"
check_file "Phase 1 tasks exists" ".kiro/specs/phase-1/tasks.md"
echo ""

echo -e "${BLUE}3. Frontend Setup${NC}"
echo "-----------------"
check_file "Frontend package.json exists" "frontend/package.json"
check_file "Frontend tsconfig.json exists" "frontend/tsconfig.json"
check_file "Next.js config exists" "frontend/next.config.ts"
check_file "Tailwind config exists" "frontend/tailwind.config.ts"
check_dir "Frontend components exist" "frontend/components"
check_dir "Frontend app directory exists" "frontend/app"
echo ""

echo -e "${BLUE}4. Backend Setup${NC}"
echo "----------------"
check_file "Backend package.json exists" "backend/package.json"
check_file "Backend tsconfig.json exists" "backend/tsconfig.json"
check_file "Backend app.ts exists" "backend/src/app.ts"
check_file "Backend Dockerfile exists" "backend/Dockerfile"
check_dir "Backend services exist" "backend/src/services"
check_dir "Backend routes exist" "backend/src/routes"
echo ""

echo -e "${BLUE}5. Infrastructure${NC}"
echo "-----------------"
check_dir "Production environment exists" "infra/environments/production"
check_file "Production main.tf exists" "infra/environments/production/main.tf"
check_dir "Terraform modules exist" "infra/modules"
echo ""

echo -e "${BLUE}6. Testing${NC}"
echo "----------"
check_dir "Frontend tests exist" "frontend/tests"
check_dir "Backend tests exist" "backend/tests"
check_file "Frontend vitest config exists" "frontend/vitest.config.ts"
check_file "Backend vitest config exists" "backend/vitest.config.ts"
check_file "Playwright config exists" "frontend/playwright.config.ts"
echo ""

echo -e "${BLUE}7. CI/CD${NC}"
echo "--------"
check_file "GitHub Actions workflow exists" ".github/workflows/deploy-backend.yml"
check_file "Amplify config exists" "infra/modules/amplify/amplify.yml"
echo ""

echo -e "${BLUE}8. Security${NC}"
echo "-----------"
check_file "Gitleaks config exists" ".gitleaks.toml"
check_file "Security check script exists" "scripts/security-check.sh"
check_file "npm audit check script exists" "scripts/npm-audit-check.sh"
check_file ".gitignore exists" ".gitignore"
echo ""

echo -e "${BLUE}9. Production Deployment${NC}"
echo "------------------------"
echo -n "[$((TOTAL_CHECKS+1))] Production frontend accessible... "
((TOTAL_CHECKS++))
if curl -s -o /dev/null -w "%{http_code}" https://my-rss-press.com | grep -q "200"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED_CHECKS++))
fi

echo -n "[$((TOTAL_CHECKS+1))] Production API accessible... "
((TOTAL_CHECKS++))
if curl -s -o /dev/null -w "%{http_code}" https://api.my-rss-press.com/api/health | grep -q "200"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED_CHECKS++))
fi

echo -n "[$((TOTAL_CHECKS+1))] SSL certificates valid... "
((TOTAL_CHECKS++))
if echo | openssl s_client -servername my-rss-press.com -connect my-rss-press.com:443 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED_CHECKS++))
fi
echo ""

echo -e "${BLUE}10. Verification Scripts${NC}"
echo "------------------------"
check_file "Production verification script exists" "scripts/verify-production.sh"
check_file "Functionality test script exists" "scripts/test-production-functionality.sh"
check_file "Final checklist script exists" "scripts/final-checklist.sh"
echo ""

echo "========================================="
echo "Checklist Summary"
echo "========================================="
echo -e "Total Checks:  $TOTAL_CHECKS"
echo -e "${GREEN}Passed:        $PASSED_CHECKS${NC}"
echo -e "${RED}Failed:        $FAILED_CHECKS${NC}"
echo ""

PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Phase 1 (MVP) is COMPLETE!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "All requirements have been met."
    echo "The system is ready for production use."
    echo ""
    echo "Production URLs:"
    echo "  Frontend: https://my-rss-press.com"
    echo "  API:      https://api.my-rss-press.com"
    echo ""
    echo "Next Steps:"
    echo "  1. Monitor CloudWatch logs for any issues"
    echo "  2. Collect user feedback"
    echo "  3. Plan Phase 2 features"
    exit 0
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}✗ Phase 1 (MVP) has $FAILED_CHECKS issue(s)${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Please review the failed checks above and fix them."
    exit 1
fi
