# Outputs for Amplify module

output "app_id" {
  description = "ID of the Amplify app"
  value       = aws_amplify_app.main.id
}

output "app_arn" {
  description = "ARN of the Amplify app"
  value       = aws_amplify_app.main.arn
}

output "default_domain" {
  description = "Default domain of the Amplify app"
  value       = aws_amplify_app.main.default_domain
}

output "custom_domain" {
  description = "Custom domain name"
  value       = aws_amplify_domain_association.main.domain_name
}

output "branch_name" {
  description = "Name of the main branch"
  value       = aws_amplify_branch.main.branch_name
}

output "app_url" {
  description = "URL of the deployed app"
  value       = "https://${var.domain_name}"
}
