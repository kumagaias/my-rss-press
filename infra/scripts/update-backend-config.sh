#!/bin/bash
# Script to update backend.tf with the correct AWS account ID

set -e

BACKEND_FILE="infra/environments/production/backend.tf"

echo "🔧 Updating backend configuration with AWS account ID..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials are not configured"
    echo "Please run: aws configure"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: ${AWS_ACCOUNT_ID}"

# Check if backend.tf exists
if [ ! -f "${BACKEND_FILE}" ]; then
    echo "❌ Error: ${BACKEND_FILE} not found"
    exit 1
fi

# Update backend.tf
if grep -q "REPLACE_WITH_ACCOUNT_ID" "${BACKEND_FILE}"; then
    sed -i.bak "s/REPLACE_WITH_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" "${BACKEND_FILE}"
    echo "✅ Updated ${BACKEND_FILE}"
    echo ""
    echo "📦 Bucket name: myrsspress-production-${AWS_ACCOUNT_ID}-terraform-state"
    echo ""
    echo "🔧 Next steps:"
    echo "  1. Review the changes in ${BACKEND_FILE}"
    echo "  2. Run: ./infra/scripts/create-backend.sh"
    echo "  3. Run: cd infra/environments/production && terraform init -migrate-state"
else
    echo "⚠️  backend.tf already configured or placeholder not found"
    echo "Current bucket configuration:"
    grep "bucket" "${BACKEND_FILE}" | head -1
fi
