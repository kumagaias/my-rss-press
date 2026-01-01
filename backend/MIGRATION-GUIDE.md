# Category Management Migration Guide

This guide describes how to migrate from hardcoded category/feed constants to DynamoDB-based dynamic category management.

## Overview

Phase 3 introduces dynamic category management using DynamoDB. This migration moves category and feed data from code constants to the database, enabling updates without code deployment.

## Prerequisites

- AWS credentials configured
- DynamoDB table deployed with CategoryLocale GSI
- Backend code deployed with Phase 3 changes

## Migration Steps

### Step 1: Verify Infrastructure

Ensure the DynamoDB table has the CategoryLocale GSI:

```bash
aws dynamodb describe-table \
  --table-name myrsspress-newspapers-production \
  --region ap-northeast-1 \
  --query 'Table.GlobalSecondaryIndexes[?IndexName==`CategoryLocale`]'
```

Expected output: Should show the CategoryLocale index configuration.

### Step 2: Backup Current Data

Create a backup of the DynamoDB table before migration:

```bash
aws dynamodb create-backup \
  --table-name myrsspress-newspapers-production \
  --backup-name myrsspress-pre-category-migration-$(date +%Y%m%d-%H%M%S) \
  --region ap-northeast-1
```

### Step 3: Run Migration in Dry-Run Mode

Preview the migration without writing data:

```bash
cd backend
npm run migrate:categories:dry-run
```

Review the output to ensure:
- 8 categories will be created (4 EN + 4 JA)
- 8 feeds will be created
- All data looks correct

### Step 4: Run Actual Migration

Execute the migration:

```bash
cd backend
npm run migrate:categories
```

Expected output:
```
============================================================
Category Migration Script
============================================================
Mode: ACTUAL MIGRATION

Summary:
  Categories: 8
  Feeds: 8

Starting migration...

Migrating categories...
  ✅ Created category: general-news-en (General News)
  ✅ Created category: technology-en (Technology)
  ...

Categories migrated: 8/8

Migrating feeds...
  ✅ Created feed: BBC News (general-news-en)
  ✅ Created feed: The New York Times (general-news-en)
  ...

Feeds migrated: 8/8

============================================================
MIGRATION COMPLETE
  Categories: 8/8
  Feeds: 8/8
============================================================
```

### Step 5: Verify Migration

Verify the data was created correctly:

```bash
# Check categories
aws dynamodb query \
  --table-name myrsspress-newspapers-production \
  --index-name CategoryLocale \
  --key-condition-expression "GSI1PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"CATEGORY_LOCALE#en"}}' \
  --region ap-northeast-1

# Check feeds
aws dynamodb query \
  --table-name myrsspress-newspapers-production \
  --key-condition-expression "PK = :pk AND begins_with(SK, :sk)" \
  --expression-attribute-values '{":pk":{"S":"CATEGORY#general-news-en"},":sk":{"S":"FEED#"}}' \
  --region ap-northeast-1
```

### Step 6: Test API Endpoints

Test the category management APIs:

```bash
# List all categories
curl https://api.my-rss-press.com/api/admin/categories

# Get specific category
curl https://api.my-rss-press.com/api/admin/categories/technology-en

# List feeds for a category
curl https://api.my-rss-press.com/api/admin/categories/feeds/general-news-en
```

### Step 7: Monitor Application

Monitor the application for 24-48 hours:

1. Check CloudWatch logs for errors
2. Monitor cache hit rate (should be > 90%)
3. Verify feed suggestions still work
4. Check fallback usage (should be minimal)

### Step 8: Remove Old Constants (Optional)

After verifying the system is stable (1 week recommended):

1. Remove `getAllDefaultFeeds` hardcoded data from `bedrockService.ts`
2. Remove fallback code from `categoryFallback.ts`
3. Update tests to remove constant-based mocks

## Rollback Procedure

If issues occur, rollback using these steps:

### Option 1: Revert Code Deployment

Revert to the previous code version that uses constants:

```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Wait for GitHub Actions to deploy
```

### Option 2: Restore from Backup

Restore the DynamoDB table from backup:

```bash
# List backups
aws dynamodb list-backups \
  --table-name myrsspress-newspapers-production \
  --region ap-northeast-1

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name myrsspress-newspapers-production-restored \
  --backup-arn <backup-arn> \
  --region ap-northeast-1
```

### Option 3: Deactivate Categories

Mark all categories as inactive to force fallback:

```bash
# This would require a script to update all categories
# For now, reverting code is the recommended approach
```

## Troubleshooting

### Migration Script Fails

**Symptom**: Migration script exits with error

**Solution**:
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify table exists: `aws dynamodb describe-table --table-name myrsspress-newspapers-production`
3. Check CloudWatch logs for detailed error messages

### Categories Not Appearing

**Symptom**: API returns empty categories

**Solution**:
1. Verify migration completed: Check DynamoDB console
2. Check cache: Cache may need 5 minutes to refresh
3. Verify GSI: Ensure CategoryLocale index is ACTIVE

### High Fallback Usage

**Symptom**: Logs show frequent fallback to constants

**Solution**:
1. Check DynamoDB service health
2. Verify network connectivity
3. Check IAM permissions for DynamoDB access
4. Review CloudWatch metrics for throttling

### Performance Degradation

**Symptom**: Slow response times

**Solution**:
1. Check cache hit rate (should be > 90%)
2. Verify DynamoDB is not throttled
3. Check Lambda cold starts
4. Review CloudWatch metrics

## Monitoring Metrics

Key metrics to monitor:

- **Cache Hit Rate**: > 90% (CloudWatch custom metric)
- **DynamoDB Read Capacity**: Should be low with caching
- **Fallback Count**: Should be near zero
- **API Latency**: < 100ms for category queries
- **Error Rate**: < 1%

## Admin API Authentication Setup

⚠️ **SECURITY REQUIREMENT**: The Admin API is protected by API Key authentication using AWS Secrets Manager.

### Step 1: Create API Key Secret

Generate a secure API key and store it in AWS Secrets Manager:

```bash
# Generate a secure random API key (32 characters)
API_KEY=$(openssl rand -base64 32)

# Create the secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name myrsspress/admin-api-key \
  --secret-string "{\"apiKey\":\"$API_KEY\"}" \
  --region ap-northeast-1 \
  --description "Admin API key for MyRSSPress category management"

# Save the API key securely (you'll need it for API calls)
echo "Your Admin API Key: $API_KEY"
```

### Step 2: Update Lambda IAM Role

Grant the Lambda function permission to read the secret:

```bash
# Get the Lambda role name
ROLE_NAME=$(aws lambda get-function \
  --function-name myrsspress-backend-production \
  --region ap-northeast-1 \
  --query 'Configuration.Role' \
  --output text | awk -F'/' '{print $NF}')

# Create and attach the policy
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "secretsmanager:GetSecretValue",
        "Resource": "arn:aws:secretsmanager:ap-northeast-1:*:secret:myrsspress/admin-api-key-*"
      }
    ]
  }'
```

### Step 3: Verify Authentication

Test the authentication with your API key:

```bash
# Set your API key
export ADMIN_API_KEY="your-api-key-here"

# Test authentication (should return 401 without key)
curl https://api.my-rss-press.com/api/admin/categories

# Test with valid key (should return categories)
curl https://api.my-rss-press.com/api/admin/categories \
  -H "X-API-Key: $ADMIN_API_KEY"
```

## Admin API Usage

After setting up authentication, you can manage categories via API:

```bash
# Set your API key
export ADMIN_API_KEY="your-api-key-here"

# Create a new category
curl -X POST https://api.my-rss-press.com/api/admin/categories \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -d '{
    "categoryId": "science-en",
    "locale": "en",
    "displayName": "Science",
    "keywords": ["science", "research", "discovery"],
    "order": 5
  }'

# Update a category
curl -X PUT https://api.my-rss-press.com/api/admin/categories/science-en \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -d '{
    "displayName": "Science & Research"
  }'

# Add a feed
curl -X POST https://api.my-rss-press.com/api/admin/categories/feeds \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -d '{
    "categoryId": "science-en",
    "url": "https://www.science.org/rss/news_current.xml",
    "title": "Science Magazine",
    "description": "Latest science news",
    "language": "en",
    "priority": 1
  }'
```

### Authentication Errors

**401 Unauthorized**: Missing `X-API-Key` header
```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing X-API-Key header"
}
```

**403 Forbidden**: Invalid API key
```json
{
  "error": "FORBIDDEN",
  "message": "Invalid API key"
}
```

### Security Best Practices

1. **Never commit API keys** to version control
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use environment variables** for local development
4. **Monitor API usage** via CloudWatch logs
5. **Restrict IP access** via AWS WAF (optional but recommended)

## Success Criteria

Migration is considered successful when:

- ✅ All 8 categories created in DynamoDB
- ✅ All 8 feeds created in DynamoDB
- ✅ All existing tests pass
- ✅ Feed suggestions work correctly
- ✅ Cache hit rate > 90%
- ✅ No increase in error rate
- ✅ Fallback usage < 1%
- ✅ Admin API responds correctly

## Support

For issues or questions:
1. Check CloudWatch logs: `/aws/lambda/myrsspress-backend-production`
2. Review DynamoDB metrics in AWS Console
3. Check GitHub Issues: https://github.com/kumagaias/my-rss-press/issues
