# Lambda function for backend API

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_exec" {
  name = "${var.function_name}-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "MyRSSPress Lambda Execution Role"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for DynamoDB access
resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.function_name}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })
}

# Policy for Bedrock access
resource "aws_iam_role_policy" "bedrock_access" {
  name = "${var.function_name}-bedrock-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          # Foundation models are AWS-managed, use * for account ID
          "arn:aws:bedrock:${var.bedrock_region}:*:foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
        ]
      }
    ]
  })
}

# Policy for ECR access (to pull Docker images)
resource "aws_iam_role_policy" "ecr_access" {
  name = "${var.function_name}-ecr-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
        Resource = var.ecr_repository_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function
resource "aws_lambda_function" "api" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec.arn

  # Use ECR image
  package_type = "Image"
  image_uri    = var.ecr_image_uri

  timeout     = 30
  memory_size = 512

  environment {
    variables = {
      BEDROCK_REGION  = var.bedrock_region
      DYNAMODB_TABLE  = var.dynamodb_table_name
      NODE_ENV        = var.environment
    }
  }

  tags = {
    Name        = "MyRSSPress API"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 7

  tags = {
    Name        = "MyRSSPress Lambda Logs"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}
