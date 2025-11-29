# MyRSSPress Infrastructure

This directory contains Terraform infrastructure-as-code for deploying MyRSSPress to AWS.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.11.0
- AWS CLI configured with appropriate credentials
- GitHub personal access token (for Amplify)
- Domain registered at XServer (my-rss-press.com)

## Directory Structure

```
infra/
├── environments/
│   └── production/          # Production environment
│       ├── main.tf          # Main configuration
│       ├── variables.tf     # Variable definitions
│       ├── outputs.tf       # Output definitions
│       └── terraform.tfvars # Variable values (not in git)
└── modules/                 # Reusable modules
    ├── route53/            # DNS hosted zone
    ├── acm/                # SSL certificates
    ├── dynamodb/           # Database
    ├── ecr/                # Container registry
    ├── lambda/             # Backend function
    ├── api-gateway/        # API endpoint
    └── amplify/            # Frontend hosting
```

## Setup Instructions

### 1. Configure Variables

```bash
cd infra/environments/production
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your values:
- `github_repository`: Your GitHub repository URL
- `github_access_token`: Your GitHub personal access token

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

### 5. Configure DNS at XServer

After deployment, Terraform will output Route53 name servers:

```
route53_name_servers = [
  "ns-xxxx.awsdns-xx.com",
  "ns-xxxx.awsdns-xx.net",
  "ns-xxxx.awsdns-xx.org",
  "ns-xxxx.awsdns-xx.co.uk"
]
```

Configure these name servers in XServer:
1. Log in to XServer control panel
2. Go to Domain Settings → Name Server Settings
3. Select `my-rss-press.com`
4. Choose "Use other name servers"
5. Enter the 4 Route53 name servers
6. Save settings

DNS propagation may take up to 48 hours (usually a few hours).

### 6. Build and Push Docker Image

Before the Lambda function can work, you need to build and push the backend Docker image:

```bash
# From project root
cd backend
npm run build

# Build Docker image
docker build -t myrsspress-backend .

# Get ECR repository URL from Terraform output
ECR_URL=$(cd ../infra/environments/production && terraform output -raw ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

# Tag and push image
docker tag myrsspress-backend:latest $ECR_URL:latest
docker push $ECR_URL:latest

# Update Lambda function to use the new image
aws lambda update-function-code \
  --function-name myrsspress-api \
  --image-uri $ECR_URL:latest
```

### 7. Verify Deployment

Check the deployment:

```bash
# Get deployment URLs
terraform output deployment_summary

# Test API health endpoint
curl https://api.my-rss-press.com/api/health

# Visit frontend
open https://my-rss-press.com
```

## Deployed Resources

- **Route53**: DNS hosted zone for my-rss-press.com
- **ACM**: SSL certificate for *.my-rss-press.com
- **DynamoDB**: Newspapers table with GSIs
- **ECR**: Container registry for backend
- **Lambda**: Backend API function
- **API Gateway**: REST API with custom domain
- **Amplify**: Frontend hosting with auto-deploy

## Cost Estimate

Monthly costs (approximate):
- Route53 hosted zone: $0.50
- DynamoDB (on-demand): ~$1-5
- Lambda: ~$0-5 (within free tier)
- API Gateway: ~$0-5 (within free tier)
- Amplify: ~$0 (within free tier)
- ACM: Free
- **Total**: ~$2-15/month

## Maintenance

### Update Infrastructure

```bash
# Make changes to .tf files
terraform plan
terraform apply
```

### Destroy Infrastructure

```bash
terraform destroy
```

**Warning**: This will delete all resources and data!

## Troubleshooting

### Certificate Validation Stuck

If ACM certificate validation is stuck:
1. Check Route53 for validation records
2. Ensure name servers are configured at XServer
3. Wait for DNS propagation (up to 48 hours)

### Lambda Function Not Working

1. Check CloudWatch Logs: `/aws/lambda/myrsspress-api`
2. Verify ECR image exists and is tagged correctly
3. Check IAM permissions for Lambda execution role

### Amplify Build Failing

1. Check Amplify console for build logs
2. Verify `amplify.yml` configuration
3. Check environment variables are set correctly

## Security Notes

- Never commit `terraform.tfvars` to version control
- Store GitHub token securely
- Use AWS Secrets Manager for production secrets
- Enable MFA on AWS account
- Regularly review IAM permissions

## Support

For issues or questions, refer to:
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)
- Project documentation in `.kiro/specs/`
