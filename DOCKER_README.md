# Docker Setup and Deployment Guide

This guide covers Docker configuration, local development, and production deployment for the Automatic Image Titling Application.

## 🐳 Docker Configuration Overview

### Files Structure
```
├── backend/
│   ├── Dockerfile          # Production backend image
│   ├── Dockerfile.dev      # Development backend image
│   └── .dockerignore       # Backend build exclusions
├── frontend/
│   ├── Dockerfile          # Production frontend image
│   ├── nginx.conf          # Nginx configuration
│   └── .dockerignore       # Frontend build exclusions
├── docker-compose.yml      # Production multi-service setup
├── docker-compose.dev.yml  # Development setup with hot reload
└── apprunner.yaml          # AWS App Runner configuration
```

## 🚀 Quick Start

### Development Environment
```bash
# Start development environment with hot reloading
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

### Production Environment
```bash
# Build and start production services
docker-compose up --build

# Or run services individually
docker-compose up backend
docker-compose up frontend
```

## 🔧 Dockerfile Improvements

### Backend Dockerfile (Production)
- **Multi-stage build** for smaller final image
- **Python 3.11** (upgraded from 3.10)
- **Non-root user** for security
- **Health checks** for monitoring
- **Virtual environment** isolation
- **Layer caching** optimization

### Frontend Dockerfile (Production)
- **Multi-stage build** with Node.js and Nginx
- **Optimized static file serving**
- **Security headers** configuration
- **Gzip compression** enabled
- **React Router** support

### Development Dockerfiles
- **Hot reloading** support
- **Volume mounting** for live code changes
- **Development tools** included
- **Faster rebuilds** with minimal layers

## 📊 App Runner Configuration

### Enhanced apprunner.yaml
```yaml
version: 1.0
runtime: docker
dockerfilePath: backend/Dockerfile
port: 8080
healthCheckPath: /health
healthCheckInterval: 30
healthCheckTimeout: 5
healthyThreshold: 3
unhealthyThreshold: 3
cpu: 1 vCPU
memory: 2 GB
maxConcurrency: 100
maxSize: 10
```

### Key Improvements
- **Health check configuration** for reliability
- **Resource limits** for cost optimization
- **Concurrency settings** for performance
- **Auto-scaling** configuration

## 🔒 Security Enhancements

### Container Security
- **Non-root user** execution
- **Minimal base images** (slim variants)
- **Security headers** in Nginx
- **Vulnerability scanning** in CI/CD

### Network Security
- **Isolated networks** in Docker Compose
- **Port exposure** control
- **Health check endpoints** for monitoring

## 📈 Performance Optimizations

### Build Optimizations
- **Multi-stage builds** reduce image size
- **Layer caching** for faster rebuilds
- **Dockerignore files** exclude unnecessary files
- **Alpine base images** for smaller footprint

### Runtime Optimizations
- **Gzip compression** for static assets
- **Nginx caching** for better performance
- **Worker processes** configuration
- **Resource limits** for stability

## 🏥 Health Monitoring

### Health Check Endpoints
- **Backend**: `GET /health`
- **Frontend**: `GET /health`
- **Docker health checks** with curl
- **App Runner health monitoring**

### Monitoring Features
- **Response time tracking**
- **Error rate monitoring**
- **Resource utilization** metrics
- **Auto-restart** on failures

## 🔄 CI/CD Integration

### GitHub Actions Workflow
- **Automated testing** for both services
- **Security scanning** with Trivy
- **Multi-stage deployment** pipeline
- **ECR image building** and pushing
- **App Runner deployment** automation

### Deployment Pipeline
1. **Code push** triggers workflow
2. **Backend tests** and linting
3. **Frontend tests** and build
4. **Security vulnerability** scanning
5. **Docker image** building and pushing
6. **Infrastructure deployment** with CDK
7. **App Runner service** update

## 🛠️ Development Workflow

### Local Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build backend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Testing
```bash
# Build production images
docker-compose build

# Run production stack
docker-compose up -d

# Check service health
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
```

## 📋 Environment Variables

### Backend Environment
```bash
AWS_REGION=us-east-1
AWS_PROFILE=default
PYTHONPATH=/app
```

### Frontend Environment
```bash
REACT_APP_API_URL=http://localhost:8080
CHOKIDAR_USEPOLLING=true
```

## 🔍 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000/8080 are available
2. **Permission issues**: Ensure proper file ownership
3. **Build failures**: Check Dockerfile syntax and dependencies
4. **Health check failures**: Verify endpoint availability

### Debug Commands
```bash
# Check container status
docker ps -a

# View container logs
docker logs <container_name>

# Execute commands in container
docker exec -it <container_name> /bin/bash

# Check resource usage
docker stats
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/) 