# Amplify App for frontend hosting

resource "aws_amplify_app" "main" {
  name       = var.app_name
  repository = var.github_repository

  # Build settings
  build_spec = file("${path.module}/amplify.yml")

  # Environment variables
  environment_variables = {
    NEXT_PUBLIC_API_BASE_URL = var.api_base_url
    NODE_ENV                 = var.environment
  }

  # Enable auto branch creation for pull requests
  enable_auto_branch_creation = false
  enable_branch_auto_build    = true
  enable_branch_auto_deletion = false

  # Custom rules for SPA routing
  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  tags = {
    Name        = "MyRSSPress Frontend"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}

# Main branch
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = "main"

  enable_auto_build = true

  environment_variables = {
    NEXT_PUBLIC_API_BASE_URL = var.api_base_url
  }

  tags = {
    Name        = "MyRSSPress Main Branch"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}

# Custom domain association
resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = var.domain_name

  # Root domain
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  # www subdomain
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }

  wait_for_verification = true
}
