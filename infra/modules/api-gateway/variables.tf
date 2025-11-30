# Variables for API Gateway module

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "myrsspress-api"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to integrate"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  type        = string
}

variable "custom_domain_name" {
  description = "Custom domain name for the API"
  type        = string
  default     = "api.my-rss-press.com"
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for the custom domain"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS record"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}
