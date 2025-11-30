# AWS Region Configuration Guide

This document explains the AWS region configuration for MyRSSPress.

## Region Strategy

### Primary Region: ap-northeast-1 (Tokyo)

All resources except ACM certificates are deployed in **ap-northeast-1 (Tokyo)**:

- Lambda functions
- DynamoDB tables
- ECR repositories
- API Gateway
- S3 buckets (Terraform state)
- DynamoDB table (Terraform locks)
- Secrets Manager
- Route53 (global service)

### Exception: ACM Certificates

ACM certificates for CloudFront **must be in us-east-1 (N. Virginia)**:

- CloudFront is a global service
- CloudFront only accepts ACM certificates from us-east-1
- This is an AWS requirement, not a configuration choice

## Terraform Configuration

### Provider Configuration

```hcl
# infra/environments/production/main.tf

# Primary provider (ap-northeast-1)
provider "aws" {
  region = "ap-northeast-1"
}

# ACM provider (us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ACM module uses us-east-1 provider
module "acm" {
  source = "../../modules/acm"
  
  providers = {
    aws = aws.us_east_1
  }
  
  # ...
}
```

### Backend Configuration

```hcl
# infra/environments/production/backend.tf
terraform {
  backend "s3" {
    bucket         = "myrsspress-production-{account-id}-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"  # Primary region
    dynamodb_table = "myrsspress-terraform-locks"
    encrypt        = true
  }
}
```

## AWS CLI Configuration

### Default Region

Set your default region to ap-northeast-1:

```bash
aws configure set region ap-northeast-1
```

Or in `~/.aws/config`:

```ini
[default]
region = ap-northeast-1
output = json
```

### Region-Specific Commands

When running AWS CLI commands, use the appropriate region:

```bash
# Lambda (ap-northeast-1)
aws lambda get-function \
  --function-name myrsspress-api \
  --region ap-northeast-1

# ECR (ap-northeast-1)
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin {account-id}.dkr.ecr.ap-northeast-1.amazonaws.com

# CloudWatch Logs (ap-northeast-1)
aws logs tail /aws/lambda/myrsspress-api --follow --region ap-northeast-1

# ACM (us-east-1 for CloudFront certificates)
aws acm list-certificates --region us-east-1
```

## Environment Variables

### Backend

```bash
# backend/.env.local
BEDROCK_REGION=ap-northeast-1
DYNAMODB_TABLE=newspapers-local
NODE_ENV=development
```

### GitHub Actions

```yaml
# .github/workflows/deploy-backend.yml
env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY: myrsspress-backend
```

## Why ap-northeast-1?

1. **Latency**: Closest region to Japan for optimal performance
2. **Bedrock Availability**: Claude 3.5 Haiku is available in ap-northeast-1
3. **Cost**: Competitive pricing for Tokyo region
4. **Compliance**: Data residency in Japan if required

## Common Issues

### Issue: ACM Certificate Not Found

**Problem**: CloudFront cannot find the ACM certificate.

**Solution**: Ensure the certificate is created in us-east-1:

```bash
# Check certificate in us-east-1
aws acm list-certificates --region us-east-1

# NOT in ap-northeast-1
aws acm list-certificates --region ap-northeast-1  # Won't work for CloudFront
```

### Issue: Lambda Function Not Found

**Problem**: AWS CLI cannot find the Lambda function.

**Solution**: Use ap-northeast-1 region:

```bash
# Correct
aws lambda get-function --function-name myrsspress-api --region ap-northeast-1

# Wrong
aws lambda get-function --function-name myrsspress-api --region us-east-1
```

### Issue: ECR Login Failed

**Problem**: Docker login to ECR fails.

**Solution**: Use the correct region in the ECR URL:

```bash
# Correct
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin {account-id}.dkr.ecr.ap-northeast-1.amazonaws.com

# Wrong
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin {account-id}.dkr.ecr.us-east-1.amazonaws.com
```

## Resource ARN Patterns

```
# Lambda
arn:aws:lambda:ap-northeast-1:{account-id}:function:myrsspress-api

# DynamoDB
arn:aws:dynamodb:ap-northeast-1:{account-id}:table/myrsspress-newspapers

# ECR
arn:aws:ecr:ap-northeast-1:{account-id}:repository/myrsspress-backend

# S3 (global, but in ap-northeast-1)
arn:aws:s3:::myrsspress-production-{account-id}-terraform-state

# ACM (us-east-1 for CloudFront)
arn:aws:acm:us-east-1:{account-id}:certificate/{certificate-id}

# Secrets Manager
arn:aws:secretsmanager:ap-northeast-1:{account-id}:secret:myrsspress-*

# Bedrock (ap-northeast-1)
arn:aws:bedrock:ap-northeast-1:*:foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0
```

## Summary

| Resource | Region | Reason |
|----------|--------|--------|
| Lambda | ap-northeast-1 | Primary region |
| DynamoDB | ap-northeast-1 | Primary region |
| ECR | ap-northeast-1 | Primary region |
| API Gateway | ap-northeast-1 | Primary region |
| S3 (State) | ap-northeast-1 | Primary region |
| Secrets Manager | ap-northeast-1 | Primary region |
| Bedrock | ap-northeast-1 | Model availability |
| **ACM** | **us-east-1** | **CloudFront requirement** |
| Route53 | Global | Global service |
| CloudFront | Global | Global CDN |
