#!/bin/bash

# Pre-deployment validation script for MyRSSPress infrastructure
# This script checks if all prerequisites are met before running terraform apply

set -e

echo "========================================="
echo "MyRSSPress Pre-Deployment Validation"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_CHECKS_PASSED=true

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ALL_CHECKS_PASSED=false
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: Terraform installed
echo "Checking prerequisites..."
echo ""

if command -v terraform &> /dev/null; then
    TERRAFORM_VERSION=$(terraform version -json | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)
    print_status 0 "Terraform installed (version: $TERRAFORM_VERSION)"
else
    print_status 1 "Terraform not installed"
    echo "  Install from: https://www.terraform.io/downloads.html"
fi

# Check 2: AWS CLI installed
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
    print_status 0 "AWS CLI installed (version: $AWS_VERSION)"
else
    print_status 1 "AWS CLI not installed"
    echo "  Install from: https://aws.amazon.com/cli/"
fi

# Check 3: Docker installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_status 0 "Docker installed (version: $DOCKER_VERSION)"
else
    print_status 1 "Docker not installed"
    echo "  Install from: https://www.docker.com/get-started"
fi

# Check 4: Node.js installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js installed (version: $NODE_VERSION)"
else
    print_status 1 "Node.js not installed"
    echo "  Install from: https://nodejs.org/"
fi

echo ""
echo "Checking AWS configuration..."
echo ""

# Check 5: AWS credentials configured
if aws sts get-caller-identity &> /dev/null; then
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
    print_status 0 "AWS credentials configured"
    echo "  Account: $AWS_ACCOUNT"
    echo "  User: $AWS_USER"
else
    print_status 1 "AWS credentials not configured"
    echo "  Run: aws configure"
fi

# Check 6: AWS region configuration
AWS_REGION=$(aws configure get region)
if [ "$AWS_REGION" = "ap-northeast-1" ]; then
    print_status 0 "AWS region set to ap-northeast-1"
else
    print_warning "AWS region is set to $AWS_REGION (expected: ap-northeast-1)"
    echo "  Note: ACM certificates for CloudFront must be in us-east-1"
fi

echo ""
echo "Checking Terraform configuration..."
echo ""

# Check 7: terraform.tfvars exists
if [ -f "terraform.tfvars" ]; then
    print_status 0 "terraform.tfvars file exists"
    
    # Check if GitHub token is set
    if grep -q "YOUR_GITHUB_TOKEN_HERE" terraform.tfvars; then
        print_status 1 "GitHub token not set in terraform.tfvars"
        echo "  Edit terraform.tfvars and replace YOUR_GITHUB_TOKEN_HERE"
    else
        print_status 0 "GitHub token appears to be set"
    fi
else
    print_status 1 "terraform.tfvars file not found"
    echo "  Copy terraform.tfvars.example to terraform.tfvars"
    echo "  Run: cp terraform.tfvars.example terraform.tfvars"
fi

# Check 8: Terraform initialized
if [ -d ".terraform" ]; then
    print_status 0 "Terraform initialized"
else
    print_status 1 "Terraform not initialized"
    echo "  Run: terraform init"
fi

echo ""
echo "Checking backend build..."
echo ""

# Check 9: Backend dependencies installed
if [ -d "../../../backend/node_modules" ]; then
    print_status 0 "Backend dependencies installed"
else
    print_status 1 "Backend dependencies not installed"
    echo "  Run: cd ../../../backend && npm install"
fi

# Check 10: Backend built
if [ -d "../../../backend/dist" ]; then
    print_status 0 "Backend built"
else
    print_status 1 "Backend not built"
    echo "  Run: cd ../../../backend && npm run build"
fi

echo ""
echo "Checking frontend build..."
echo ""

# Check 11: Frontend dependencies installed
if [ -d "../../../frontend/node_modules" ]; then
    print_status 0 "Frontend dependencies installed"
else
    print_status 1 "Frontend dependencies not installed"
    echo "  Run: cd ../../../frontend && npm install"
fi

echo ""
echo "========================================="

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "You can now proceed with deployment:"
    echo "  1. terraform plan"
    echo "  2. terraform apply"
    echo ""
    exit 0
else
    echo -e "${RED}Some checks failed!${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    echo ""
    exit 1
fi
