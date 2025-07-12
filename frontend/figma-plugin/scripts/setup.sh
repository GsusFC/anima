#!/bin/bash

# AnimaGen Figma Plugin Setup Script

echo "🚀 Setting up AnimaGen Figma Plugin..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed successfully"

# Build the plugin
echo "🔨 Building plugin..."
npm run build:dev

echo "✅ Plugin built successfully"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Figma Desktop App"
echo "2. Go to Plugins → Development → Import plugin from manifest"
echo "3. Select \"dist/manifest.json\" from this project"
echo "4. Run \"npm run dev\" to start development with hot reload"
echo ""
echo "Happy coding! 🎨"
