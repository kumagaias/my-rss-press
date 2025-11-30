# Outputs for DynamoDB module

output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.newspapers.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.newspapers.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.newspapers.id
}

output "gsi_popular_name" {
  description = "Name of the PublicNewspapers GSI"
  value       = "PublicNewspapers"
}

output "gsi_recent_name" {
  description = "Name of the RecentNewspapers GSI"
  value       = "RecentNewspapers"
}
