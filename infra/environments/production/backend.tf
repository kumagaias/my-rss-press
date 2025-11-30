# S3 Backend configuration for Terraform state management
# This file configures remote state storage in S3 with DynamoDB locking

terraform {
  backend "s3" {
    bucket         = "myrsspress-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "myrsspress-terraform-locks"
    encrypt        = true

    # Enable versioning for state file history
    # Configured in the S3 bucket itself
  }
}
