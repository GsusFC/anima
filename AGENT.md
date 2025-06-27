# AnimaGen - Coding Agent Guide

## Commands
**Backend**: `cd backend && npm start` (dev: `npm run dev`, test: `npm test`, single test: `npm test -- --testNamePattern="test name"`)
**Frontend**: `cd frontend && npm run dev` (build: `npm run build`, preview: `npm run preview`)
**Ports**: Backend:3001, Frontend:5173 (or auto-assigned Vite port)

## Architecture
- **Backend**: Express.js + Socket.IO + FFmpeg + Jest tests (Node.js/CommonJS)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (ES modules)
- **API**: REST endpoints + WebSocket for progress tracking
- **File handling**: Multer uploads → FFmpeg processing → streaming downloads
- **Structure**: `backend/` (server + tests), `frontend/src/` (components + hooks)

## Code Style
**Backend**: CommonJS (`require/module.exports`), no types, camelCase, Express patterns
**Frontend**: TypeScript strict, ES modules (`import/export`), React hooks, functional components
**Imports**: Absolute paths from src/, group external → internal → relative
**Naming**: camelCase vars/functions, PascalCase components/interfaces, kebab-case files
**Error handling**: try/catch with meaningful messages, API returns `{success, message}` format
**Testing**: Jest with supertest for API tests, describe/test structure
