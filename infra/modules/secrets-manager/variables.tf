# Variables for Secrets Manager module

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "myrsspress"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
}
