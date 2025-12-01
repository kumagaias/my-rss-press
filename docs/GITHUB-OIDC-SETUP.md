# GitHub OIDC Setup Guide

This guide explains how to set up GitHub OIDC authentication for AWS deployments.

## Overview

GitHub OIDC (OpenID Connect) allows GitHub Actions to authenticate with AWS without storing long-term credentials. This is more secure than using Access Keys.

## Prerequisites

- AWS account with admin access
- GitHub repository
- Terraform installed

## Setup Steps

### 1. Configure Terraform Variables

Edit `infra/environments/production/terraform.tfvars`:

```hcl
# GitHub Configuration
github_org  = "your-github-username"  # or organization name
github_repo = "my-rss-press"          # repository name
```

### 2. Deploy Infrastructure with Terraform

```bash
cd infra/environments/production

# Initialize Terraform
terraform init

# Plan the changes
terraform plan

# Apply the changes
terraform apply
```

This will create:
- IAM OIDC Identity Provider for GitHub
- IAM Role for GitHub Actions
- Necessary permissions for ECR and Lambda

### 3. Get the IAM Role ARN

After `terraform apply` completes, get the role ARN:

```bash
terraform output github_actions_role_arn
```

Example output:
```
arn:aws:iam::123456789012:role/myrsspress-github-actions-role
```

### 4. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - Name: `AWS_ROLE_ARN`
   - Value: `arn:aws:iam::123456789012:role/myrsspress-github-actions-role` (from step 3)

### 5. Remove Old Secrets (if any)

If you previously used Access Keys, remove these secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## How It Works

1. GitHub Actions requests a temporary token from GitHub's OIDC provider
2. GitHub Actions uses this token to assume the IAM role in AWS
3. AWS validates the token and grants temporary credentials
4. GitHub Actions uses these credentials to deploy to ECR and Lambda
5. Credentials automatically expire after the workflow completes

## Security Benefits

- ✅ No long-term credentials stored in GitHub
- ✅ Credentials automatically rotate
- ✅ Reduced risk of credential leakage
- ✅ Fine-grained permissions via IAM role
- ✅ Audit trail in AWS CloudTrail

## Troubleshooting

### Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Cause:** The IAM role's trust policy doesn't allow your repository.

**Solution:** Check that `github_org` and `github_repo` in `terraform.tfvars` match your repository.

### Error: "No OIDC provider found"

**Cause:** The OIDC provider wasn't created.

**Solution:** Run `terraform apply` again to create the OIDC provider.

### Error: "Access Denied" when pushing to ECR

**Cause:** The IAM role doesn't have ECR permissions.

**Solution:** Check the IAM policy in `infra/modules/github-oidc/main.tf`.

## Testing

Test the OIDC setup by pushing a change to the backend:

```bash
# Make a small change
echo "# Test" >> backend/README.md

# Commit and push
git add backend/README.md
git commit -m "test: Test GitHub OIDC deployment"
git push origin main
```

Check the GitHub Actions workflow to verify it can authenticate with AWS.

## References

- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS IAM OIDC Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
