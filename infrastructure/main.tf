terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

resource "aws_dynamodb_table" "users" {
  name           = "Users"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5              # within free tier
  write_capacity = 5              # within free tier
  hash_key       = "email"

  attribute {
    name = "email"
    type = "S"
  }

  tags = {
    Name        = "Users"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "cv_nodes" {
  name           = "cv-nodes"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5              # within free tier
  write_capacity = 5              # within free tier
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "cv-nodes"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "cv_links" {
  name           = "cv-links"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5              # within free tier
  write_capacity = 5              # within free tier
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "cv-links"
    Environment = "dev"
  }
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.users.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.users.arn
}

output "cv_nodes_table_name" {
  value = aws_dynamodb_table.cv_nodes.name
}

output "cv_links_table_name" {
  value = aws_dynamodb_table.cv_links.name
}