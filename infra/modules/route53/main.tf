# Route53 Hosted Zone for my-rss-press.com

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = "MyRSSPress"
    Environment = var.environment
    Project     = "MyRSSPress"
  }
}
