#!/bin/bash

# Validation script for Terraform configuration
# This script checks if Terraform is installed and validates the configuration

set -e

echo "🔍 Checking Terraform installation..."

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed"
    echo ""
    echo "Please install Terraform:"
    echo "  macOS: brew install terraform"
    echo "  Other: https://www.terraform.io/downloads.html"
    exit 1
fi

echo "✅ Terraform is installed: $(terraform version | head -n 1)"
echo ""

# Check Terraform version
TERRAFORM_VERSION=$(terraform version -json | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)
REQUIRED_VERSION="1.10.0"

echo "🔍 Checking Terraform version..."
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$TERRAFORM_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Terraform version $TERRAFORM_VERSION is less than required version $REQUIRED_VERSION"
    exit 1
fi

echo "✅ Terraform version is compatible"
echo ""

# Check if terraform.tfvars exists
echo "🔍 Checking configuration files..."
if [ ! -f "terraform.tfvars" ]; then
    echo "⚠️  terraform.tfvars not found"
    echo "   Please copy terraform.tfvars.example to terraform.tfvars and configure it"
    echo "   cp terraform.tfvars.example terraform.tfvars"
    exit 1
fi

echo "✅ terraform.tfvars exists"
echo ""

# Initialize Terraform
echo "🔍 Initializing Terraform..."
terraform init -upgrade

echo ""
echo "🔍 Validating Terraform configuration..."
terraform validate

echo ""
echo "🔍 Formatting check..."
terraform fmt -check -recursive || {
    echo "⚠️  Some files need formatting. Run: terraform fmt -recursive"
}

echo ""
echo "✅ All validation checks passed!"
echo ""
echo "Next steps:"
echo "  1. Review the plan: terraform plan"
echo "  2. Deploy: terraform apply"
