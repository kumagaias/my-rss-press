# Outputs for Route53 module

output "zone_id" {
  description = "The hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "Name servers for the hosted zone (to be configured in XServer)"
  value       = aws_route53_zone.main.name_servers
}

output "zone_name" {
  description = "The hosted zone name"
  value       = aws_route53_zone.main.name
}
