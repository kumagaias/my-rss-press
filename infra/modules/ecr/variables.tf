# Variables for ECR module

variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "myrsspress-backend"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}
