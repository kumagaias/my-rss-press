# S3 Backend configuration for Terraform state management
# This file configures remote state storage in S3 with DynamoDB locking

terraform {
  backend "s3" {
    bucket         = "myrsspress-production-843925270284-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "myrsspress-terraform-locks"
    encrypt        = true
  }
}
