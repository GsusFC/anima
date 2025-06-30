#!/bin/bash
# Railway deployment script
echo "Starting Railway deployment..."

# Use Docker build explicitly
echo "Building with Docker..."
exec docker build -t animagen .
