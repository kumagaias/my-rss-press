#!/bin/bash
# Script to delete S3 bucket and DynamoDB table for Terraform backend
# ⚠️  WARNING: This will delete all Terraform state! Use with extreme caution.

set -e

# Configuration
BUCKET_NAME="myrsspress-terraform-state"
DYNAMODB_TABLE="myrsspress-terraform-locks"
AWS_REGION="us-east-1"

echo "⚠️  WARNING: This will delete Terraform backend resources!"
echo ""
echo "Resources to be deleted:"
echo "  S3 Bucket:       ${BUCKET_NAME}"
echo "  DynamoDB Table:  ${DYNAMODB_TABLE}"
echo "  Region:          ${AWS_REGION}"
echo ""
echo "This will permanently delete all Terraform state files!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "🗑️  Deleting Terraform backend resources..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials are not configured"
    exit 1
fi

# Delete S3 bucket
echo "📦 Deleting S3 bucket: ${BUCKET_NAME}"
if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
    # Remove all objects and versions
    echo "🗑️  Removing all objects and versions..."
    aws s3api delete-objects \
        --bucket "${BUCKET_NAME}" \
        --delete "$(aws s3api list-object-versions \
            --bucket "${BUCKET_NAME}" \
            --output json \
            --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" \
        2>/dev/null || true
    
    # Remove delete markers
    aws s3api delete-objects \
        --bucket "${BUCKET_NAME}" \
        --delete "$(aws s3api list-object-versions \
            --bucket "${BUCKET_NAME}" \
            --output json \
            --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')" \
        2>/dev/null || true
    
    # Delete bucket
    aws s3api delete-bucket \
        --bucket "${BUCKET_NAME}" \
        --region "${AWS_REGION}"
    
    echo "✅ Deleted S3 bucket: ${BUCKET_NAME}"
else
    echo "⚠️  Bucket does not exist: ${BUCKET_NAME}"
fi

echo ""

# Delete DynamoDB table
echo "🗄️  Deleting DynamoDB table: ${DYNAMODB_TABLE}"
if aws dynamodb describe-table --table-name "${DYNAMODB_TABLE}" --region "${AWS_REGION}" &>/dev/null; then
    aws dynamodb delete-table \
        --table-name "${DYNAMODB_TABLE}" \
        --region "${AWS_REGION}"
    
    echo "⏳ Waiting for table to be deleted..."
    aws dynamodb wait table-not-exists \
        --table-name "${DYNAMODB_TABLE}" \
        --region "${AWS_REGION}"
    
    echo "✅ Deleted DynamoDB table: ${DYNAMODB_TABLE}"
else
    echo "⚠️  Table does not exist: ${DYNAMODB_TABLE}"
fi

echo ""
echo "✅ Terraform backend resources deleted successfully!"
echo ""
