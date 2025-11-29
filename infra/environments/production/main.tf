# Main Terraform configuration for production environment

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure after creating S3 bucket and DynamoDB table
  # backend "s3" {
  #   bucket         = "myrsspress-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "myrsspress-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MyRSSPress"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

# Route53 Hosted Zone
module "route53" {
  source = "../../modules/route53"

  domain_name = var.domain_name
  environment = var.environment
}

# ACM Certificate
module "acm" {
  source = "../../modules/acm"

  domain_name      = var.domain_name
  route53_zone_id  = module.route53.zone_id
  environment      = var.environment
}

# DynamoDB Table
module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name  = var.dynamodb_table_name
  environment = var.environment
}

# ECR Repository
module "ecr" {
  source = "../../modules/ecr"

  repository_name = var.ecr_repository_name
  environment     = var.environment
}

# Lambda Function
module "lambda" {
  source = "../../modules/lambda"

  function_name       = var.lambda_function_name
  ecr_image_uri       = "${module.ecr.repository_url}:latest"
  dynamodb_table_name = module.dynamodb.table_name
  dynamodb_table_arn  = module.dynamodb.table_arn
  bedrock_region      = var.bedrock_region
  environment         = var.environment

  depends_on = [module.ecr, module.dynamodb]
}

# API Gateway
module "api_gateway" {
  source = "../../modules/api-gateway"

  api_name             = var.api_gateway_name
  lambda_function_name = module.lambda.function_name
  lambda_invoke_arn    = module.lambda.function_invoke_arn
  custom_domain_name   = "api.${var.domain_name}"
  acm_certificate_arn  = module.acm.validated_certificate_arn
  route53_zone_id      = module.route53.zone_id
  environment          = var.environment

  depends_on = [module.lambda, module.acm]
}

# Amplify Hosting
module "amplify" {
  source = "../../modules/amplify"

  app_name             = var.amplify_app_name
  github_repository    = var.github_repository
  github_access_token  = var.github_access_token
  domain_name          = var.domain_name
  api_base_url         = module.api_gateway.custom_domain_url
  environment          = var.environment

  depends_on = [module.api_gateway]
}
