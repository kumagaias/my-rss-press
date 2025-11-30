# Variables for Amplify module

variable "app_name" {
  description = "Name of the Amplify app"
  type        = string
  default     = "myrsspress-frontend"
}

variable "github_repository" {
  description = "GitHub repository URL (e.g., https://github.com/username/repo)"
  type        = string
}

variable "github_token_secret_id" {
  description = "Secrets Manager secret ID containing GitHub access token"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for the app"
  type        = string
  default     = "my-rss-press.com"
}

variable "api_base_url" {
  description = "Base URL of the backend API"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}
