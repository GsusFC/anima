# AnimaGen

Professional animation creation tool for converting images to GIF, MP4, and WebM formats.

## 🚀 Live Demo

**Frontend Only**: The Vercel deployment includes only the frontend interface.

**Full Experience**: For complete functionality including file processing, run locally:

```bash
# Backend
cd backend && npm install && npm start

# Frontend  
cd frontend && npm install && npm run dev
```

## ✨ Features

- **Multi-format Export**: GIF, MP4, WebM
- **Timeline Editor**: Drag & drop with custom transitions
- **Real-time Preview**: Live preview with progress tracking
- **Composition System**: Export once, convert to any format instantly
- **Professional UI**: Clean interface with format-aware controls

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Socket.IO + FFmpeg
- **Processing**: FFmpeg for video/gif generation
- **Real-time**: WebSocket progress tracking

## 📦 Architecture

```
frontend/     # React SPA (deployed to Vercel)
backend/      # Express API + FFmpeg processing
```

**Note**: This repository contains both frontend and backend. The Vercel deployment serves only the frontend as a demonstration of the UI and workflows.

## 🔧 Local Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/GsusFC/anima.git
   cd anima
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start  # Runs on :3001
   ```

3. **Frontend Setup**
   ```bash
   cd frontend  
   npm install
   npm run dev  # Runs on :5173
   ```

## 📋 Requirements

- Node.js 18+
- FFmpeg (for backend processing)
- Modern browser with ES2020+ support

---

**AnimaGen** - Transform your images into professional animations ✨
