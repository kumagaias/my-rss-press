# Outputs for Secrets Manager module

output "github_token_secret_id" {
  description = "Secret ID for GitHub access token"
  value       = aws_secretsmanager_secret.github_token.id
}

output "github_token_secret_arn" {
  description = "ARN of the GitHub access token secret"
  value       = aws_secretsmanager_secret.github_token.arn
}
