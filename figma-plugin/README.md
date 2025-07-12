# AnimaGen Figma Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/GsusFC/anima/tree/main/figma-plugin)

> Export Figma frames directly to AnimaGen for creating stunning animated slideshows

## 🚀 Features

- **One-Click Export**: Export selected Figma frames directly to AnimaGen
- **Smart Configuration**: Automatic transition and timing optimization
- **Batch Processing**: Handle multiple frames efficiently
- **Order Preservation**: Maintain frame sequence automatically
- **High Quality**: Support for PNG/JPG export up to 4K resolution
- **Secure Authentication**: Encrypted API key storage
- **Real-time Progress**: Live feedback during export process

## 📦 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- Figma Desktop App
- AnimaGen account with API access

### Development Setup

1. **Clone and Install**
   ```bash
   cd figma-plugin
   npm install
   ```

2. **Start Development**
   ```bash
   npm run dev
   ```

3. **Load Plugin in Figma**
   - Open Figma Desktop App
   - Go to Plugins → Development → Import plugin from manifest
   - Select `dist/manifest.json` from the project

4. **Test the Plugin**
   - Create some frames in Figma
   - Run the AnimaGen Exporter plugin
   - Follow the authentication setup

## 🛠️ Development Commands

```bash
npm run dev          # Start development with hot reload
npm run build        # Build for production
npm run build:dev    # Build for development
npm run type-check   # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run package      # Create plugin package for distribution
npm run clean        # Clean dist folder
```

## 📁 Project Structure

```
figma-plugin/
├── src/
│   ├── plugin/              # Main thread code
│   │   ├── code.ts         # Entry point
│   │   ├── controllers/    # Business logic controllers
│   │   ├── services/       # API and external services
│   │   └── utils/          # Utilities and helpers
│   ├── ui/                 # UI thread code
│   │   ├── index.tsx       # React entry point
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   └── styles/         # CSS styles
│   └── shared/             # Shared types and utilities
├── dist/                   # Build output
├── tests/                  # Test files
├── manifest.json           # Figma plugin manifest
├── webpack.config.js       # Webpack configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the plugin root:

```env
ANIMAGEN_API_BASE=http://localhost:5000
PLUGIN_VERSION=2.0.0
NODE_ENV=development
```

### Figma Plugin Manifest

The `manifest.json` is configured for:
- Network access to AnimaGen API
- Current user permissions
- Dynamic page access for frame detection

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for API communication
├── e2e/           # End-to-end user workflow tests
├── fixtures/      # Test data and mock responses
└── setup.ts       # Test setup and configuration
```

## 🔌 Plugin Architecture

### Main Thread (Plugin Code)

- **FrameController**: Detects and analyzes Figma frames
- **ExportController**: Handles frame export and upload process
- **AuthController**: Manages user authentication and API keys
- **MessageHandler**: Coordinates communication with UI

### UI Thread (React App)

- **App**: Main application component with routing
- **AuthSetup**: Authentication and API key setup
- **MainInterface**: Main plugin interface (to be implemented)
- **PluginContext**: Global state management

### Communication

Plugin and UI communicate via `postMessage` API:

```typescript
// Plugin → UI
figma.ui.postMessage({
  type: 'frames-detected',
  data: { frames: detectedFrames }
});

// UI → Plugin
parent.postMessage({
  pluginMessage: {
    type: 'export-frames',
    data: { frameIds, settings }
  }
}, '*');
```

## 🔐 Authentication

The plugin uses AnimaGen API keys for authentication:

1. User generates API key from AnimaGen dashboard
2. Key is validated against AnimaGen API
3. Key is stored securely in Figma's client storage
4. Automatic renewal when possible

## 📊 Current Status

### ✅ Implemented
- [x] Project structure and build system
- [x] Basic plugin architecture
- [x] Frame detection and analysis
- [x] Authentication system (basic)
- [x] UI components and styling
- [x] Error handling and logging

### 🚧 In Progress
- [ ] Complete export functionality
- [ ] AnimaGen API integration
- [ ] Advanced UI components
- [ ] Comprehensive testing

### 📋 TODO
- [ ] Export settings configuration
- [ ] Progress tracking UI
- [ ] Error recovery mechanisms
- [ ] Performance optimizations
- [ ] Documentation completion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/GsusFC/anima/issues)
- **Documentation**: [Project Docs](../docs/)
- **Email**: support@animagen.com

---

Made with ❤️ by the AnimaGen team
