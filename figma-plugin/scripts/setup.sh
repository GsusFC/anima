#!/bin/bash

# AnimaGen Figma Plugin Setup Script

echo "🚀 Setting up AnimaGen Figma Plugin..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the plugin
echo "🔨 Building plugin..."
npm run build:dev

if [ $? -ne 0 ]; then
    echo "❌ Failed to build plugin"
    exit 1
fi

echo "✅ Plugin built successfully"

# Check if dist folder exists and has required files
if [ ! -f "dist/manifest.json" ] || [ ! -f "dist/code.js" ] || [ ! -f "dist/ui.html" ]; then
    echo "❌ Build incomplete. Missing required files in dist/"
    exit 1
fi

echo "✅ All required files generated"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Figma Desktop App"
echo "2. Go to Plugins → Development → Import plugin from manifest"
echo "3. Select 'dist/manifest.json' from this project"
echo "4. Run 'npm run dev' to start development with hot reload"
echo ""
echo "Happy coding! 🎨"
