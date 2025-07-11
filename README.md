# AnimaGen

> **Professional Animation Creation Tool** - Transform your images into stunning GIF, MP4, and WebM animations with advanced timeline editing and real-time preview.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![FFmpeg Required](https://img.shields.io/badge/FFmpeg-Required-red.svg)](https://ffmpeg.org/)

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **FFmpeg** - [Installation guide](https://ffmpeg.org/download.html)
- **Modern browser** with ES2020+ support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GsusFC/anima.git
   cd anima
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install && cd ..

   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start individually:
   # Backend: cd backend && npm start (port 3001)
   # Frontend: cd frontend && npm run dev (port 5173)
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Choose between **Slideshow** or **Video Editor** modes

## ✨ Features

### 🎬 Animation Creation
- **Multi-format Export**: Generate GIF, MP4, WebM, and MOV files
- **Timeline Editor**: Intuitive drag & drop interface with custom transitions
- **Real-time Preview**: Live preview with progress tracking
- **Professional Transitions**: Fade, slide, zoom, and advanced effects

### 🎨 User Experience
- **Dual Mode Interface**: Slideshow creator and professional video editor
- **Responsive Design**: Works on desktop and tablet devices
- **Dark Theme**: Professional dark interface optimized for long sessions
- **Real-time Feedback**: WebSocket-powered progress updates

### ⚡ Performance
- **Composition System**: Export once, convert to any format instantly
- **Queue Processing**: Background job processing with Redis (optional)
- **Optimized Pipeline**: FFmpeg-powered processing for high-quality output
- **Smart Caching**: Efficient file management and cleanup

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **DnD Kit** for drag & drop functionality
- **Socket.IO Client** for real-time communication

### Backend
- **Express.js** REST API server
- **Socket.IO** for real-time progress updates
- **FFmpeg** for video/animation processing
- **Multer** for file upload handling
- **BullMQ + Redis** for job queue processing (optional)

### Development Tools
- **TypeScript** for type safety
- **Jest** for testing
- **Nodemon** for development
- **PM2** for production deployment

## 📦 Project Structure

```
AnimaGen/
├── 📁 frontend/              # React TypeScript SPA
│   ├── 📁 src/
│   │   ├── 📁 slideshow/     # Image slideshow creator
│   │   ├── 📁 video-editor/  # Professional video editor
│   │   ├── 📁 shared/        # Reusable components & utilities
│   │   └── 📁 components/    # Core UI components
│   ├── 📄 package.json
│   └── 📄 vite.config.ts
├── 📁 backend/               # Express.js API server
│   ├── 📁 routes/            # API endpoints
│   ├── 📁 workers/           # Background job processors
│   ├── 📁 services/          # Business logic
│   ├── 📁 utils/             # Helper functions
│   └── 📄 index.js           # Main server file
├── 📁 tests/                 # Test suites
├── 📄 package.json           # Root package configuration
└── 📄 README.md              # This file
```

## 🎯 Usage Guide

### Slideshow Mode
1. **Upload Images**: Drag & drop or click to upload multiple images
2. **Arrange Timeline**: Drag images to reorder in the timeline
3. **Add Transitions**: Click between images to add transition effects
4. **Configure Settings**: Set duration, quality, and output format
5. **Preview**: Generate real-time preview of your animation
6. **Export**: Download your finished GIF, MP4, or WebM

### Video Editor Mode
1. **Upload Videos**: Import video files for editing
2. **Trim & Split**: Use timeline controls to trim video segments
3. **Add Effects**: Apply transitions and visual effects
4. **Arrange Sequence**: Drag to reorder video clips
5. **Export**: Generate final video in multiple formats

## 🔧 Development

### Available Scripts

```bash
# Root level commands
npm run dev          # Start both frontend and backend
npm run build        # Build for production
npm test             # Run backend tests
npm run test:ui      # Run UI automation tests

# Backend specific
cd backend
npm start            # Start production server
npm run dev          # Start with nodemon
npm run pm2:start    # Start with PM2
npm test             # Run Jest tests

# Frontend specific
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Configuration

Create `.env` files in the backend directory:

```bash
# backend/.env.development
NODE_ENV=development
PORT=3001
OUTPUT_DIR=output
TEMP_DIR=uploads
REDIS_URL=redis://localhost:6379  # Optional
CORS_ORIGINS=http://localhost:5173
```

### FFmpeg Installation

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
- Download from [FFmpeg.org](https://ffmpeg.org/download.html)
- Add to system PATH

**Verify installation:**
```bash
ffmpeg -version
```

## 🚀 Deployment

### Production Setup

1. **Build frontend**
   ```bash
   cd frontend && npm run build
   ```

2. **Configure backend**
   ```bash
   cd backend
   cp .env.example .env.production
   # Edit .env.production with your settings
   ```

3. **Start with PM2**
   ```bash
   cd backend
   npm run pm2:start
   ```

### Docker Deployment

```bash
# Build and run with Docker
docker build -t animagen .
docker run -p 3001:3001 animagen
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `OUTPUT_DIR` | Export files directory | `output` |
| `TEMP_DIR` | Temporary files directory | `uploads` |
| `REDIS_URL` | Redis connection URL | `undefined` |
| `MAX_FILE_SIZE` | Maximum upload size | `52428800` (50MB) |
| `CORS_ORIGINS` | Allowed CORS origins | `localhost:5173` |

## 🧪 Testing

### Automated Tests
```bash
# Backend API tests
npm test

# Frontend UI tests
npm run test:ui

# Complete workflow test
npm run test:workflow
```

### Manual Testing
1. Start development servers: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Test image upload and timeline functionality
4. Verify export generation and download

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure FFmpeg compatibility
- Test on multiple browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**FFmpeg not found:**
- Ensure FFmpeg is installed and in system PATH
- Verify with `ffmpeg -version`

**Port already in use:**
- Change ports in package.json scripts
- Kill existing processes: `lsof -ti:3001 | xargs kill`

**Upload fails:**
- Check file size limits (50MB default)
- Verify supported formats: JPG, PNG, GIF

### Getting Help
- 📧 **Issues**: [GitHub Issues](https://github.com/GsusFC/anima/issues)
- 📖 **Documentation**: [Wiki](https://github.com/GsusFC/anima/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/GsusFC/anima/discussions)

---

<div align="center">

**AnimaGen** - Transform your images into professional animations ✨

Made with ❤️ by [GsusFC](https://github.com/GsusFC)

[⭐ Star this repo](https://github.com/GsusFC/anima) • [🐛 Report Bug](https://github.com/GsusFC/anima/issues) • [💡 Request Feature](https://github.com/GsusFC/anima/issues)

</div>
