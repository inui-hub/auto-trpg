output "frontend_url" {
  description = "CloudFront Distribution Domain Name"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "api_endpoint" {
  description = "HTTP API Gateway Endpoint URL"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}
