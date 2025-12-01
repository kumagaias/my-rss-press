# S3 Backend configuration for Terraform state management
# This file configures remote state storage in S3 with DynamoDB locking
# Currently commented out - using local backend for initial setup

# terraform {
#   backend "s3" {
#     # Bucket name format: myrsspress-production-{account-id}-terraform-state
#     # Replace {account-id} with your AWS account ID
#     # Example: myrsspress-production-123456789012-terraform-state
#     bucket         = "myrsspress-production-REPLACE_WITH_ACCOUNT_ID-terraform-state"
#     key            = "production/terraform.tfstate"
#     region         = "ap-northeast-1"
#     dynamodb_table = "myrsspress-terraform-locks"
#     encrypt        = true
#
#     # Enable versioning for state file history
#     # Configured in the S3 bucket itself
#   }
# }
