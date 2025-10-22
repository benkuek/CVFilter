# Infrastructure

## Setup
```bash
# Install Terraform
# https://developer.hashicorp.com/terraform/downloads

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply

# Destroy resources
terraform destroy
```

## Environment Variables
Set these after deployment:
```bash
STORAGE_TYPE=dynamodb
DYNAMODB_TABLE=Users
AWS_REGION=us-east-1
```