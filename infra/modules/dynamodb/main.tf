# DynamoDB Table for Newspapers

resource "aws_dynamodb_table" "newspapers" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST" # On-demand pricing
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI for public newspapers sorted by view count (popular)
  global_secondary_index {
    name            = "PublicNewspapers"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI for public newspapers sorted by creation date (recent)
  global_secondary_index {
    name            = "RecentNewspapers"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # GSI for category management (locale-based queries)
  global_secondary_index {
    name            = "CategoryLocale"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # Note: GSI1PK and GSI1SK attributes are already defined above
  # They are reused for both PublicNewspapers and CategoryLocale indexes

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "MyRSSPress Newspapers"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}
