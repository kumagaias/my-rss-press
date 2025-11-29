# Outputs for ACM module

output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "certificate_domain_name" {
  description = "Domain name of the certificate"
  value       = aws_acm_certificate.main.domain_name
}

output "certificate_status" {
  description = "Status of the certificate"
  value       = aws_acm_certificate.main.status
}

output "validated_certificate_arn" {
  description = "ARN of the validated certificate"
  value       = aws_acm_certificate_validation.main.certificate_arn
}
