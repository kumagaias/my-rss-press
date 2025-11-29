# Variables for ACM module

variable "domain_name" {
  description = "Domain name for the certificate"
  type        = string
  default     = "my-rss-press.com"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}
