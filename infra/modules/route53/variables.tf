# Variables for Route53 module

variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
  default     = "my-rss-press.com"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}
