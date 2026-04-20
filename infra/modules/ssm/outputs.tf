output "github_token_param_name" {
  description = "SSM Parameter name for GitHub access token"
  value       = aws_ssm_parameter.github_token.name
}

output "admin_api_key_param_name" {
  description = "SSM Parameter name for Admin API key"
  value       = aws_ssm_parameter.admin_api_key.name
}
