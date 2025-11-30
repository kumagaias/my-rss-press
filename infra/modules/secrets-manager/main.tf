# Secrets Manager for storing sensitive configuration

# GitHub Access Token for Amplify
resource "aws_secretsmanager_secret" "github_token" {
  name        = "${var.project_name}-github-amplify-token-${var.environment}"
  description = "GitHub Personal Access Token for Amplify deployment"

  tags = {
    Name        = "GitHub Amplify Token"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "github_token" {
  secret_id     = aws_secretsmanager_secret.github_token.id
  secret_string = var.github_access_token
}
