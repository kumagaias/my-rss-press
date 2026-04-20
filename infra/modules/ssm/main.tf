# SSM Parameter Store for storing sensitive configuration

# GitHub Access Token for Amplify
resource "aws_ssm_parameter" "github_token" {
  name        = "/${var.project_name}/${var.environment}/github-amplify-token"
  description = "GitHub Personal Access Token for Amplify deployment"
  type        = "SecureString"
  value       = var.github_access_token

  tags = {
    Name        = "GitHub Amplify Token"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Admin API Key for backend authentication
resource "aws_ssm_parameter" "admin_api_key" {
  name        = "/${var.project_name}/${var.environment}/admin-api-key"
  description = "Admin API key for backend authentication"
  type        = "SecureString"
  value       = var.admin_api_key

  tags = {
    Name        = "Admin API Key"
    Environment = var.environment
    Project     = var.project_name
  }
}
