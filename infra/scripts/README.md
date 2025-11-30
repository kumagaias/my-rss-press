# Terraform Backend Scripts

AWS CLI scripts for managing Terraform backend resources (S3 bucket and DynamoDB table).

## Scripts

### update-backend-config.sh

Updates `backend.tf` with your AWS account ID.

**Usage:**
```bash
./infra/scripts/update-backend-config.sh
```

**What it does:**
- Gets your AWS account ID
- Updates `backend.tf` with the correct bucket name
- Creates backup file (`backend.tf.bak`)

**Run this first** before creating backend resources.

### create-backend.sh

Creates S3 bucket and DynamoDB table for Terraform state management.

**Usage:**
```bash
./infra/scripts/create-backend.sh
```

**What it does:**
- Gets your AWS account ID automatically
- Creates S3 bucket: `myrsspress-production-{account-id}-terraform-state`
- Enables versioning on the bucket
- Enables AES256 encryption
- Blocks all public access
- Adds project tags
- Creates DynamoDB table: `myrsspress-terraform-locks`
- Configures pay-per-request billing

**Prerequisites:**
- AWS CLI installed and configured
- AWS credentials with appropriate permissions

### delete-backend.sh

Deletes S3 bucket and DynamoDB table.

**⚠️ WARNING:** This permanently deletes all Terraform state files!

**Usage:**
```bash
./infra/scripts/delete-backend.sh
```

**What it does:**
- Gets your AWS account ID automatically
- Prompts for confirmation
- Removes all objects and versions from S3 bucket
- Deletes S3 bucket: `myrsspress-production-{account-id}-terraform-state`
- Deletes DynamoDB table

## Quick Start

```bash
# 1. Update backend configuration with your account ID
./infra/scripts/update-backend-config.sh

# 2. Create backend resources
./infra/scripts/create-backend.sh

# 3. Initialize Terraform
cd infra/environments/production
terraform init -migrate-state
```

## Alternative: Terraform Bootstrap

You can also use Terraform to create these resources:

```bash
cd infra/bootstrap
terraform init
terraform apply
```

See [../bootstrap/README.md](../bootstrap/README.md) for details.

## Bucket Naming Convention

Bucket names include the AWS account ID for global uniqueness:

```
myrsspress-{environment}-{account-id}-terraform-state
```

Example: `myrsspress-production-123456789012-terraform-state`

This ensures:
- Global uniqueness across all AWS accounts
- Easy identification of which account owns the bucket
- Support for multiple environments in the same account

## Which Method to Use?

**Use Scripts (Recommended):**
- Quick setup
- Automatic account ID detection
- No Terraform state to manage for bootstrap
- Simple one-time operation

**Use Terraform Bootstrap:**
- Infrastructure as Code approach
- Easier to modify and version control
- Can manage bootstrap resources with Terraform
- Also includes automatic account ID detection

## Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketTagging",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::myrsspress-production-*-terraform-state"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      "Resource": "arn:aws:s3:::myrsspress-production-*-terraform-state/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:TagResource"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/myrsspress-terraform-locks"
    }
  ]
}
```

## Troubleshooting

### Bucket already exists
If the bucket already exists, the script will skip creation and only update settings.

### Permission denied
Ensure your AWS credentials have the required IAM permissions listed above.

### Region mismatch
The scripts use `us-east-1` by default. To use a different region, edit the `AWS_REGION` variable in the scripts.
