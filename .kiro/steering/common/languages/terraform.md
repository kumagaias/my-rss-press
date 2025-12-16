# Terraform Best Practices

Terraform and Infrastructure as Code best practices.

---

## Project Structure

```
infra/
├── environments/          # Environment-specific config
│   ├── development/
│   ├── staging/
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── backend.tf
│       └── terraform.tfvars
└── modules/               # Reusable modules
    ├── compute/
    ├── database/
    └── networking/
```

## State Management

### Remote Backend (S3 + DynamoDB)

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "project-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

### Bootstrap State Backend

```hcl
# bootstrap/main.tf - Run once to create state backend
resource "aws_s3_bucket" "terraform_state" {
  bucket = "project-terraform-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

## Module Design

```hcl
# modules/lambda/main.tf
resource "aws_lambda_function" "this" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec.arn
  
  package_type  = "Image"
  image_uri     = var.image_uri
  
  timeout       = var.timeout
  memory_size   = var.memory_size
  
  environment {
    variables = var.environment_variables
  }
}

# modules/lambda/variables.tf
variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "image_uri" {
  description = "ECR image URI"
  type        = string
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
  default     = 30
}

# modules/lambda/outputs.tf
output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}
```

## Naming Conventions

```hcl
# ✅ Good: Descriptive resource names
resource "aws_lambda_function" "api_handler" {
  function_name = "${var.project_name}-api-${var.environment}"
}

# ✅ Good: Use locals for repeated values
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_lambda_function" "api_handler" {
  # ...
  tags = local.common_tags
}
```

## Variables and Outputs

```hcl
# variables.tf
variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
  
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

# outputs.tf
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_api_gateway_deployment.main.invoke_url
}
```

## Secrets Management

```hcl
# ✅ Good: Use AWS Secrets Manager
resource "aws_secretsmanager_secret" "github_token" {
  name        = "${var.project_name}-github-token-${var.environment}"
  description = "GitHub Personal Access Token"
}

# Reference secret in other resources
data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = aws_secretsmanager_secret.github_token.id
}

resource "aws_amplify_app" "main" {
  access_token = data.aws_secretsmanager_secret_version.github_token.secret_string
}

# ❌ Bad: Hardcode secrets
resource "aws_amplify_app" "main" {
  access_token = "ghp_hardcoded_token" # Never do this!
}
```

## Best Practices

### Use Data Sources

```hcl
# ✅ Good: Reference existing resources
data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
}
```

### Conditional Resources

```hcl
# ✅ Good: Create resources conditionally
resource "aws_cloudwatch_log_group" "lambda" {
  count = var.enable_logging ? 1 : 0
  
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days
}
```

### Lifecycle Rules

```hcl
# ✅ Good: Prevent accidental deletion
resource "aws_dynamodb_table" "main" {
  name = "important-table"
  
  lifecycle {
    prevent_destroy = true
  }
}

# ✅ Good: Create before destroy
resource "aws_lambda_function" "api" {
  # ...
  
  lifecycle {
    create_before_destroy = true
  }
}
```

## Workflow

```bash
# 1. Initialize (first time or after backend changes)
terraform init

# 2. Format code
terraform fmt -recursive

# 3. Validate configuration
terraform validate

# 4. Plan changes
terraform plan -out=tfplan

# 5. Apply changes
terraform apply tfplan

# 6. Verify outputs
terraform output
```

## Common Patterns

### Multi-Environment Setup

```hcl
# environments/production/main.tf
module "lambda" {
  source = "../../modules/lambda"
  
  function_name = "${var.project_name}-api-production"
  environment   = "production"
  timeout       = 60
  memory_size   = 512
}

# environments/development/main.tf
module "lambda" {
  source = "../../modules/lambda"
  
  function_name = "${var.project_name}-api-development"
  environment   = "development"
  timeout       = 30
  memory_size   = 256
}
```

### Tagging Strategy

```hcl
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
  }
}

resource "aws_lambda_function" "api" {
  # ...
  tags = merge(
    local.common_tags,
    {
      Component = "API"
      Function  = "Backend"
    }
  )
}
```

## Prohibited Practices

- ❌ Never commit `terraform.tfstate` to Git
- ❌ Never hardcode secrets in `.tf` files
- ❌ Never use local backend for production
- ❌ Never skip `terraform plan` before `apply`
- ❌ Never manually modify resources managed by Terraform
