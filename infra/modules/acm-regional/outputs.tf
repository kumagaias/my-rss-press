# Outputs for ACM Regional module

output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.regional.arn
}

output "validated_certificate_arn" {
  description = "ARN of the validated ACM certificate"
  value       = aws_acm_certificate_validation.regional.certificate_arn
}

output "domain_name" {
  description = "Domain name of the certificate"
  value       = aws_acm_certificate.regional.domain_name
}
