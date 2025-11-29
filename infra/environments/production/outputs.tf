# Outputs for production environment

# Route53
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.route53.zone_id
}

output "route53_name_servers" {
  description = "Route53 name servers (configure these in XServer)"
  value       = module.route53.name_servers
}

# ACM
output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = module.acm.certificate_arn
}

# DynamoDB
output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = module.dynamodb.table_arn
}

# ECR
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecr.repository_url
}

# Lambda
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = module.lambda.function_arn
}

# API Gateway
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "api_custom_domain_url" {
  description = "Custom domain URL for the API"
  value       = module.api_gateway.custom_domain_url
}

# Amplify
output "amplify_app_id" {
  description = "ID of the Amplify app"
  value       = module.amplify.app_id
}

output "amplify_default_domain" {
  description = "Default domain of the Amplify app"
  value       = module.amplify.default_domain
}

output "amplify_app_url" {
  description = "URL of the deployed app"
  value       = module.amplify.app_url
}

# Summary
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    frontend_url = module.amplify.app_url
    api_url      = module.api_gateway.custom_domain_url
    name_servers = module.route53.name_servers
  }
}
