# Terraform configuration for Indecisive Wear infrastructure
# This creates a complete production environment on AWS

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
  
  # Store state in S3 (create bucket first)
  # backend "s3" {
  #   bucket = "indecisive-wear-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  default     = "indecisive-wear"
}

# Random passwords for RDS and Redis
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "${var.project_name}-${var.environment}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Security Groups
resource "aws_security_group" "backend" {
  name        = "${var.project_name}-${var.environment}-backend-sg"
  description = "Security group for backend services"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-backend-sg"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = module.vpc.private_subnets
  
  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-${var.environment}-db"
  
  engine            = "postgres"
  engine_version    = "14.10"
  instance_class    = "db.t3.micro" # Free tier eligible
  allocated_storage = 20
  storage_type      = "gp3"
  
  db_name  = "medusa"
  username = "medusa"
  password = random_password.db_password.result
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-${var.environment}-redis"
  replication_group_description = "Redis cache for ${var.project_name}"
  
  engine               = "redis"
  node_type           = "cache.t3.micro" # Free tier eligible
  number_cache_clusters = 1
  port                 = 6379
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.backend.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = random_password.redis_auth_token.result
  
  automatic_failover_enabled = false
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-redis"
    Environment = var.environment
  }
}

# S3 Bucket for static assets
resource "aws_s3_bucket" "assets" {
  bucket = "${var.project_name}-${var.environment}-assets"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-assets"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ECS Cluster for Backend
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster"
    Environment = var.environment
  }
}

# ECR Repository for Docker images
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name        = "${var.project_name}-backend-ecr"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.backend.id]
  subnets           = module.vpc.public_subnets
  
  enable_deletion_protection = false
  enable_http2              = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "backend" {
  name     = "${var.project_name}-${var.environment}-backend"
  port     = 9000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-backend-tg"
  }
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Outputs
output "database_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS PostgreSQL endpoint"
  sensitive   = true
}

output "database_password" {
  value       = random_password.db_password.result
  description = "RDS PostgreSQL password"
  sensitive   = true
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  description = "Redis primary endpoint"
  sensitive   = true
}

output "redis_auth_token" {
  value       = random_password.redis_auth_token.result
  description = "Redis auth token"
  sensitive   = true
}

output "load_balancer_url" {
  value       = aws_lb.main.dns_name
  description = "Load balancer URL"
}

output "assets_bucket" {
  value       = aws_s3_bucket.assets.id
  description = "S3 bucket for assets"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR repository URL for backend"
}