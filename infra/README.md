# MyRSSPress Infrastructure

Terraform configuration for deploying MyRSSPress to AWS.

## Architecture

- **Frontend**: AWS Amplify (Next.js)
- **Backend**: Lambda + API Gateway (Hono)
- **Database**: DynamoDB
- **Container Registry**: ECR
- **State Management**: S3 + DynamoDB
- **Secrets**: AWS Secrets Manager

## Quick Start

### 1. Bootstrap (First Time Only)

Create S3 bucket and DynamoDB table for Terraform state.

**Option A: Using Script (Recommended)**
```bash
# Update backend.tf with your AWS account ID
./infra/scripts/update-backend-config.sh

# Create backend resources
./infra/scripts/create-backend.sh
```

**Option B: Using Terraform**
```bash
cd infra/bootstrap
terraform init
terraform apply

# Then update backend.tf
cd ../..
./infra/scripts/update-backend-config.sh
```

See [BOOTSTRAP-GUIDE.md](./BOOTSTRAP-GUIDE.md) for detailed instructions.

### 2. Deploy Production Environment

```bash
cd environments/production

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars

# Initialize with S3 backend
terraform init -migrate-state

# Review changes
terraform plan

# Deploy
terraform apply
```

## Directory Structure

```
infra/
├── bootstrap/              # State management resources (run once)
├── environments/
│   └── production/        # Production environment
│       ├── main.tf        # Main configuration
│       ├── backend.tf     # S3 backend config
│       ├── variables.tf   # Variable definitions
│       ├── outputs.tf     # Output values
│       └── terraform.tfvars.example
└── modules/               # Reusable modules
    ├── secrets-manager/   # Secrets Manager
    ├── route53/          # DNS
    ├── acm/              # SSL certificates
    ├── dynamodb/         # Database
    ├── ecr/              # Container registry
    ├── lambda/           # Lambda functions
    ├── api-gateway/      # API Gateway
    └── amplify/          # Frontend hosting
```

## Security

### Secrets Management

- GitHub tokens stored in AWS Secrets Manager
- Not exposed in Terraform state files
- Automatic encryption with AWS KMS

### State Management

- State stored in S3 with encryption
- DynamoDB locking prevents concurrent modifications
- Versioning enabled for state history

## Required IAM Permissions

See [BOOTSTRAP-GUIDE.md](./BOOTSTRAP-GUIDE.md#security-best-practices) for detailed IAM policy.

## Bucket Naming

S3 bucket names include your AWS account ID for global uniqueness:

```
myrsspress-production-{account-id}-terraform-state
```

Example: `myrsspress-production-123456789012-terraform-state`

## Useful Commands

```bash
# View current state
terraform show

# List resources
terraform state list

# View outputs
terraform output

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Refresh state
terraform refresh
```

## Troubleshooting

### State Lock Issues

```bash
# View locks
aws dynamodb scan --table-name myrsspress-terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### State Recovery

```bash
# Get your bucket name (includes account ID)
BUCKET_NAME=$(grep 'bucket' infra/environments/production/backend.tf | awk -F'"' '{print $2}')

# List state versions
aws s3api list-object-versions \
  --bucket "${BUCKET_NAME}" \
  --prefix production/terraform.tfstate
```

## Documentation

- [Bootstrap Guide](./BOOTSTRAP-GUIDE.md) - Detailed setup instructions
- [Deployment Guide](./DEPLOYMENT.md) - Deployment procedures
- [Quick Start](./QUICK-START.md) - Getting started guide

## Support

For issues or questions, see the main project [README](../README.md).
