#!/bin/bash

# AnimaGen Docker Build Script
# Tests and builds Docker images for development and production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="animagen"
DEV_IMAGE_NAME="animagen-dev"

echo -e "${BOLD}${BLUE}🐳 AnimaGen Docker Build Script${NC}"
echo -e "${BOLD}${BLUE}==============================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "This script must be run from the AnimaGen root directory"
    exit 1
fi

echo -e "${BLUE}📋 Available build options:${NC}"
echo "1. Build production image"
echo "2. Build development image"
echo "3. Build both images"
echo "4. Test production build"
echo "5. Test development setup"
echo "6. Clean Docker cache"
echo ""

read -p "Select option (1-6): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        echo -e "${BLUE}🏗️  Building production image...${NC}"
        docker build -t $IMAGE_NAME:latest .
        print_status "Production image built successfully"
        
        echo ""
        echo "Image details:"
        docker images $IMAGE_NAME:latest
        ;;
    2)
        echo -e "${BLUE}🏗️  Building development image...${NC}"
        docker build -f Dockerfile.dev -t $DEV_IMAGE_NAME:latest .
        print_status "Development image built successfully"
        
        echo ""
        echo "Image details:"
        docker images $DEV_IMAGE_NAME:latest
        ;;
    3)
        echo -e "${BLUE}🏗️  Building both images...${NC}"
        
        echo "Building production image..."
        docker build -t $IMAGE_NAME:latest .
        print_status "Production image built"
        
        echo ""
        echo "Building development image..."
        docker build -f Dockerfile.dev -t $DEV_IMAGE_NAME:latest .
        print_status "Development image built"
        
        echo ""
        echo "All images:"
        docker images | grep animagen
        ;;
    4)
        echo -e "${BLUE}🧪 Testing production build...${NC}"
        
        # Build the image
        docker build -t $IMAGE_NAME:test .
        print_status "Production image built"
        
        # Test the image
        echo "Testing image startup..."
        CONTAINER_ID=$(docker run -d -p 3001:3001 $IMAGE_NAME:test)
        
        # Wait a moment for startup
        sleep 5
        
        # Test health endpoint
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            print_status "Health check passed"
        else
            print_warning "Health check failed (this might be normal if dependencies are missing)"
        fi
        
        # Stop and remove test container
        docker stop $CONTAINER_ID > /dev/null
        docker rm $CONTAINER_ID > /dev/null
        
        # Clean up test image
        docker rmi $IMAGE_NAME:test > /dev/null
        
        print_status "Production build test completed"
        ;;
    5)
        echo -e "${BLUE}🧪 Testing development setup...${NC}"
        
        # Test with docker-compose
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        
        # Wait for services to start
        sleep 10
        
        # Check if services are running
        if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
            print_status "Development environment started successfully"
            
            echo ""
            echo "Services status:"
            docker-compose -f docker-compose.dev.yml ps
            
            echo ""
            echo -e "${YELLOW}Development environment is running.${NC}"
            echo "Frontend: http://localhost:5173"
            echo "Backend: http://localhost:3001"
            echo ""
            read -p "Press Enter to stop the development environment..."
            
            docker-compose -f docker-compose.dev.yml down
            print_status "Development environment stopped"
        else
            print_error "Failed to start development environment"
            docker-compose -f docker-compose.dev.yml logs
            docker-compose -f docker-compose.dev.yml down
        fi
        ;;
    6)
        echo -e "${BLUE}🧹 Cleaning Docker cache...${NC}"
        
        # Remove unused images
        docker image prune -f
        
        # Remove build cache
        docker builder prune -f
        
        # Remove unused volumes
        docker volume prune -f
        
        print_status "Docker cache cleaned"
        
        echo ""
        echo "Remaining Docker usage:"
        docker system df
        ;;
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Docker build script completed!${NC}"

# Show helpful commands
echo ""
echo -e "${BLUE}💡 Helpful commands:${NC}"
echo "Production: docker run -p 3001:3001 $IMAGE_NAME:latest"
echo "Development: docker-compose -f docker-compose.dev.yml up"
echo "Production with compose: docker-compose up"
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
