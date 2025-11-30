#!/bin/bash
# Script to create S3 bucket and DynamoDB table for Terraform backend
# This is an alternative to using the bootstrap Terraform configuration

set -e

# Configuration
ENVIRONMENT="production"
DYNAMODB_TABLE="myrsspress-terraform-locks"
AWS_REGION="us-east-1"

echo "🚀 Creating Terraform backend resources..."
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

echo "✅ AWS CLI is configured"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: ${AWS_ACCOUNT_ID}"

# Construct bucket name with account ID
BUCKET_NAME="myrsspress-${ENVIRONMENT}-${AWS_ACCOUNT_ID}-terraform-state"
echo "📦 Bucket name: ${BUCKET_NAME}"
echo ""

# Create S3 bucket
echo "📦 Creating S3 bucket: ${BUCKET_NAME}"
if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
    echo "⚠️  Bucket already exists: ${BUCKET_NAME}"
else
    # Create bucket
    if [ "${AWS_REGION}" = "us-east-1" ]; then
        # us-east-1 doesn't need LocationConstraint
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${AWS_REGION}"
    else
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${AWS_REGION}" \
            --create-bucket-configuration LocationConstraint="${AWS_REGION}"
    fi
    echo "✅ Created S3 bucket: ${BUCKET_NAME}"
fi

# Enable versioning
echo "🔄 Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled
echo "✅ Versioning enabled"

# Enable encryption
echo "🔒 Enabling encryption..."
aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'
echo "✅ Encryption enabled"

# Block public access
echo "🚫 Blocking public access..."
aws s3api put-public-access-block \
    --bucket "${BUCKET_NAME}" \
    --public-access-block-configuration \
        BlockPublicAcls=true,\
IgnorePublicAcls=true,\
BlockPublicPolicy=true,\
RestrictPublicBuckets=true
echo "✅ Public access blocked"

# Add tags
echo "🏷️  Adding tags..."
aws s3api put-bucket-tagging \
    --bucket "${BUCKET_NAME}" \
    --tagging 'TagSet=[
        {Key=Project,Value=MyRSSPress},
        {Key=ManagedBy,Value=Script},
        {Key=Purpose,Value=TerraformState}
    ]'
echo "✅ Tags added"

echo ""

# Create DynamoDB table
echo "🗄️  Creating DynamoDB table: ${DYNAMODB_TABLE}"
if aws dynamodb describe-table --table-name "${DYNAMODB_TABLE}" --region "${AWS_REGION}" &>/dev/null; then
    echo "⚠️  Table already exists: ${DYNAMODB_TABLE}"
else
    aws dynamodb create-table \
        --table-name "${DYNAMODB_TABLE}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${AWS_REGION}" \
        --tags \
            Key=Project,Value=MyRSSPress \
            Key=ManagedBy,Value=Script \
            Key=Purpose,Value=TerraformLock
    
    echo "⏳ Waiting for table to be active..."
    aws dynamodb wait table-exists \
        --table-name "${DYNAMODB_TABLE}" \
        --region "${AWS_REGION}"
    
    echo "✅ Created DynamoDB table: ${DYNAMODB_TABLE}"
fi

echo ""
echo "✅ Terraform backend resources created successfully!"
echo ""
echo "✅ Terraform backend resources created successfully!"
echo ""
echo "📋 Summary:"
echo "  S3 Bucket:       ${BUCKET_NAME}"
echo "  DynamoDB Table:  ${DYNAMODB_TABLE}"
echo "  Region:          ${AWS_REGION}"
echo "  AWS Account:     ${AWS_ACCOUNT_ID}"
echo ""
echo "🔧 Next steps:"
echo "  1. Update backend.tf: ./infra/scripts/update-backend-config.sh"
echo "  2. cd infra/environments/production"
echo "  3. terraform init -migrate-state"
echo "  4. terraform plan"
echo "  5. terraform apply"
echo ""
