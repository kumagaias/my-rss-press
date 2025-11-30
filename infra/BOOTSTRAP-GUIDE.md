# Terraform Bootstrap Guide

This guide explains how to set up Terraform state management for MyRSSPress.

## Overview

Terraform state is stored remotely in S3 with DynamoDB locking to enable:
- Team collaboration
- State history and versioning
- Concurrent execution prevention
- Secure state storage

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Terraform Execution                     │
│                  (Local or CI/CD)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              S3 Bucket (State Storage)                   │
│  - Versioning enabled                                    │
│  - Encryption at rest (AES256)                           │
│  - Public access blocked                                 │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         DynamoDB Table (State Locking)                   │
│  - Pay-per-request billing                               │
│  - Prevents concurrent modifications                     │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.10.0 installed
- IAM permissions for S3, DynamoDB, and Secrets Manager

## Step-by-Step Setup

### 1. Bootstrap Resources (One-time)

Create the S3 bucket and DynamoDB table.

**Option A: Using Script (Quick)**

```bash
# From project root
./infra/scripts/create-backend.sh
```

**Option B: Using Terraform (Infrastructure as Code)**

```bash
cd infra/bootstrap
terraform init
terraform plan
terraform apply
```

**Resources created:**
- S3 bucket: `myrsspress-terraform-state`
- DynamoDB table: `myrsspress-terraform-locks`

### 2. Store GitHub Token in Secrets Manager

```bash
# Create secret for GitHub token
aws secretsmanager create-secret \
  --name myrsspress-github-amplify-token-production \
  --description "GitHub Personal Access Token for Amplify" \
  --secret-string "ghp_your_actual_token_here"
```

### 3. Initialize Production Environment

```bash
cd infra/environments/production

# Create terraform.tfvars with your values
cat > terraform.tfvars <<EOF
domain_name          = "my-rss-press.com"
github_repository    = "https://github.com/your-org/myrsspress"
github_access_token  = "ghp_your_token_here"
EOF

# Initialize with S3 backend
terraform init -migrate-state

# Review changes
terraform plan

# Apply infrastructure
terraform apply
```

## Backend Configuration

The S3 backend is configured in `infra/environments/production/backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "myrsspress-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "myrsspress-terraform-locks"
    encrypt        = true
  }
}
```

## State Migration

If you have existing local state:

```bash
cd infra/environments/production
terraform init -migrate-state
```

Terraform will prompt you to migrate the state to S3.

## Security Best Practices

### 1. S3 Bucket Security
- ✅ Versioning enabled (state history)
- ✅ Encryption at rest (AES256)
- ✅ Public access blocked
- ✅ Bucket policy restricts access

### 2. DynamoDB Table
- ✅ Pay-per-request billing (cost-effective)
- ✅ Point-in-time recovery (optional)

### 3. Secrets Manager
- ✅ GitHub token stored securely
- ✅ Not exposed in Terraform state
- ✅ Automatic encryption with AWS KMS
- ✅ Audit logging enabled

### 4. IAM Permissions

Minimum required permissions for Terraform execution:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::myrsspress-terraform-state/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::myrsspress-terraform-state"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/myrsspress-terraform-locks"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:myrsspress-*"
    }
  ]
}
```

## Troubleshooting

### State Lock Error

If you see "Error acquiring the state lock":

```bash
# List current locks
aws dynamodb scan \
  --table-name myrsspress-terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### State Corruption

If state becomes corrupted:

```bash
# List state versions
aws s3api list-object-versions \
  --bucket myrsspress-terraform-state \
  --prefix production/terraform.tfstate

# Restore previous version
aws s3api get-object \
  --bucket myrsspress-terraform-state \
  --key production/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.backup
```

## Cleanup

To destroy all resources (use with extreme caution):

```bash
# 1. Destroy main infrastructure
cd infra/environments/production
terraform destroy

# 2. Destroy bootstrap resources
cd infra/bootstrap
terraform destroy
```

## Additional Resources

- [Terraform S3 Backend Documentation](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Terraform State Management](https://www.terraform.io/docs/language/state/index.html)
