variable "aws_region" {
  description = "AWS region for the deployment"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Base project name to use for resource naming"
  type        = string
  default     = "auto-trpg"
}
