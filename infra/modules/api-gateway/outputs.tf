# Outputs for API Gateway module

output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "custom_domain_name" {
  description = "Custom domain name for the API"
  value       = aws_api_gateway_domain_name.api.domain_name
}

output "custom_domain_url" {
  description = "Full URL of the custom domain"
  value       = "https://${aws_api_gateway_domain_name.api.domain_name}"
}

output "stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.prod.stage_name
}
