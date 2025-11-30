# Variables for DynamoDB module

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "myrsspress-newspapers"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}
