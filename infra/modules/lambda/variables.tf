# Variables for Lambda module

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "myrsspress-api"
}

variable "ecr_image_uri" {
  description = "URI of the ECR image to use for the Lambda function"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  type        = string
}

variable "bedrock_region" {
  description = "AWS region for Bedrock service"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-northeast-1"
}
