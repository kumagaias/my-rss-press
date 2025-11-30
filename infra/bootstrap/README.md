# Terraform Bootstrap

This directory contains the bootstrap configuration for Terraform state management.

## Purpose

Creates the S3 bucket and DynamoDB table required for remote state storage and locking.

## Resources Created

- **S3 Bucket**: `myrsspress-terraform-state`
  - Versioning enabled
  - Encryption at rest (AES256)
  - Public access blocked
  
- **DynamoDB Table**: `myrsspress-terraform-locks`
  - Pay-per-request billing
  - Used for state locking

## Usage

### 1. Run Bootstrap (One-time setup)

```bash
cd infra/bootstrap
terraform init
terraform plan
terraform apply
```

### 2. Configure Backend in Production

After bootstrap completes, the production environment will automatically use the S3 backend configured in `infra/environments/production/backend.tf`.

### 3. Initialize Production Environment

```bash
cd infra/environments/production
terraform init  # Will migrate state to S3
terraform plan
terraform apply
```

## Important Notes

- Run bootstrap **only once** per AWS account
- Do not delete the S3 bucket or DynamoDB table while Terraform is in use
- The bootstrap resources are managed separately from the main infrastructure
- If you need to destroy everything, destroy the main infrastructure first, then the bootstrap resources

## State Migration

If you already have local state files:

```bash
cd infra/environments/production
terraform init -migrate-state
```

Terraform will prompt you to migrate the existing state to S3.
