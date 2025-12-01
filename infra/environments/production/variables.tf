# Variables for production environment

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "my-rss-press.com"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "myrsspress-newspapers"
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "myrsspress-backend"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "myrsspress-api"
}

variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "myrsspress-api"
}

variable "amplify_app_name" {
  description = "Name of the Amplify app"
  type        = string
  default     = "myrsspress-frontend"
}

variable "github_repository" {
  description = "GitHub repository URL"
  type        = string
  # Set this in terraform.tfvars or via environment variable
}

variable "github_access_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
  # Set this in terraform.tfvars or via environment variable
}

variable "bedrock_region" {
  description = "AWS region for Bedrock service"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  # Set this in terraform.tfvars or via environment variable
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  # Set this in terraform.tfvars or via environment variable
}
