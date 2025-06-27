#!/bin/bash

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

echo "🏗️ Building frontend..."
npm run build

# Copy frontend build to backend public folder
echo "📁 Moving frontend build to backend..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

# Start backend server
echo "🚀 Starting server..."
cd ../backend && npm start
