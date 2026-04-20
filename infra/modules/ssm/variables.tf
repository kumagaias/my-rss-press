variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "github_access_token" {
  description = "GitHub Personal Access Token for Amplify"
  type        = string
  sensitive   = true
}

variable "admin_api_key" {
  description = "Admin API key for backend authentication"
  type        = string
  sensitive   = true
}
