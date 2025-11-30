# Terraform Backend Scripts

AWS CLI scripts for managing Terraform backend resources (S3 bucket and DynamoDB table).

## Scripts

### create-backend.sh

Creates S3 bucket and DynamoDB table for Terraform state management.

**Usage:**
```bash
./infra/scripts/create-backend.sh
```

**What it does:**
- Creates S3 bucket: `myrsspress-terraform-state`
- Enables versioning on the bucket
- Enables AES256 encryption
- Blocks all public access
- Adds project tags
- Creates DynamoDB table: `myrsspress-terraform-locks`
- Configures pay-per-request billing

**Prerequisites:**
- AWS CLI installed and configured
- AWS credentials with appropriate permissions

### delete-backend.sh

Deletes S3 bucket and DynamoDB table.

**⚠️ WARNING:** This permanently deletes all Terraform state files!

**Usage:**
```bash
./infra/scripts/delete-backend.sh
```

**What it does:**
- Prompts for confirmation
- Removes all objects and versions from S3 bucket
- Deletes S3 bucket
- Deletes DynamoDB table

## Alternative: Terraform Bootstrap

You can also use Terraform to create these resources:

```bash
cd infra/bootstrap
terraform init
terraform apply
```

See [../bootstrap/README.md](../bootstrap/README.md) for details.

## Which Method to Use?

**Use Scripts (create-backend.sh):**
- Quick setup
- No Terraform state to manage for bootstrap
- Simple one-time operation

**Use Terraform Bootstrap:**
- Infrastructure as Code approach
- Easier to modify and version control
- Can manage bootstrap resources with Terraform

## Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketTagging",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::myrsspress-terraform-state"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      "Resource": "arn:aws:s3:::myrsspress-terraform-state/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:TagResource"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/myrsspress-terraform-locks"
    }
  ]
}
```

## Troubleshooting

### Bucket already exists
If the bucket already exists, the script will skip creation and only update settings.

### Permission denied
Ensure your AWS credentials have the required IAM permissions listed above.

### Region mismatch
The scripts use `us-east-1` by default. To use a different region, edit the `AWS_REGION` variable in the scripts.
