# Development Guide

> Complete guide for setting up, developing, and contributing to AnimaGen.

## 🚀 Quick Setup

### Prerequisites

1. **Node.js 18+**
   ```bash
   # Check version
   node --version
   npm --version
   ```

2. **FFmpeg**
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   
   # Verify installation
   ffmpeg -version
   ```

3. **Git**
   ```bash
   git --version
   ```

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/GsusFC/anima.git
   cd anima
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Backend dependencies
   cd backend && npm install && cd ..
   
   # Frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env.development
   
   # Edit configuration if needed
   nano backend/.env.development
   ```

4. **Start development**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually:
   # Terminal 1: cd backend && npm run dev
   # Terminal 2: cd frontend && npm run dev
   ```

5. **Verify setup**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - API Status: http://localhost:3001/api/status

## 🏗️ Project Structure

```
AnimaGen/
├── 📁 frontend/                 # React TypeScript application
│   ├── 📁 src/
│   │   ├── 📁 slideshow/        # Slideshow creator components
│   │   │   ├── 📁 components/   # UI components
│   │   │   ├── 📁 hooks/        # Custom hooks
│   │   │   ├── 📁 context/      # State management
│   │   │   └── 📁 types/        # TypeScript definitions
│   │   ├── 📁 video-editor/     # Video editor components
│   │   ├── 📁 shared/           # Shared utilities
│   │   └── 📁 components/       # Global components
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📄 tailwind.config.js
├── 📁 backend/                  # Express.js API server
│   ├── 📁 routes/               # API route handlers
│   ├── 📁 workers/              # Background job processors
│   ├── 📁 services/             # Business logic
│   ├── 📁 utils/                # Helper functions
│   ├── 📁 config/               # Configuration files
│   ├── 📄 index.js              # Main server file
│   └── 📄 package.json
├── 📁 docs/                     # Documentation
├── 📁 tests/                    # Test suites
├── 📄 package.json              # Root package configuration
└── 📄 README.md
```

## 🛠️ Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-transition-effect

# Make changes
# ... code changes ...

# Test changes
npm test
npm run test:ui

# Commit changes
git add .
git commit -m "feat: add new transition effect"

# Push and create PR
git push origin feature/new-transition-effect
```

### 2. Code Standards

**TypeScript Configuration:**
- Strict mode enabled
- No unused variables/parameters
- Explicit return types for functions

**ESLint Rules:**
```json
{
  "extends": ["@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 3. Component Guidelines

**React Component Structure:**
```typescript
// ComponentName.tsx
import React from 'react';
import { ComponentProps } from './types';

interface Props extends ComponentProps {
  // Component-specific props
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="component-name">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

**Custom Hook Pattern:**
```typescript
// useFeatureName.ts
import { useState, useEffect } from 'react';

interface UseFeatureNameReturn {
  data: DataType;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFeatureName = (params: Params): UseFeatureNameReturn => {
  const [data, setData] = useState<DataType>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hook logic
  
  return { data, loading, error, refetch };
};
```

## 🧪 Testing

### Frontend Testing

**Component Tests:**
```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

**Hook Tests:**
```typescript
// useFeatureName.test.ts
import { renderHook, act } from '@testing-library/react';
import { useFeatureName } from './useFeatureName';

describe('useFeatureName', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useFeatureName());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
```

### Backend Testing

**API Tests:**
```javascript
// routes.test.js
const request = require('supertest');
const app = require('../index');

describe('Upload API', () => {
  it('should upload images successfully', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('images', 'tests/assets/test-image.jpg')
      .field('sessionId', 'test-session');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

**Service Tests:**
```javascript
// ffmpeg.test.js
const ffmpegService = require('../services/ffmpeg');

describe('FFmpeg Service', () => {
  it('should generate GIF from images', async () => {
    const result = await ffmpegService.createGIF({
      images: ['test1.jpg', 'test2.jpg'],
      duration: 1000,
      quality: 'standard'
    });
    
    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/\.gif$/);
  });
});
```

### Running Tests

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# UI automation tests
npm run test:ui

# Test coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🔧 Configuration

### Environment Variables

**Backend (.env.development):**
```bash
# Server Configuration
NODE_ENV=development
PORT=3001

# File Handling
OUTPUT_DIR=output
TEMP_DIR=uploads
MAX_FILE_SIZE=52428800
MAX_FILES=50

# Processing
DEFAULT_FPS=30
PREVIEW_MAX_WIDTH=1280
PREVIEW_MAX_HEIGHT=720

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Debug
DEBUG=animagen:*
```

**Frontend (vite.config.ts):**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### Development Tools

**Recommended VS Code Extensions:**
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- Auto Rename Tag

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 🐛 Debugging

### Frontend Debugging

**React DevTools:**
```bash
# Install React DevTools browser extension
# Available for Chrome, Firefox, Edge
```

**Console Debugging:**
```typescript
// Add debug logs
console.log('Component state:', state);
console.table(arrayData);
console.group('Function execution');
console.log('Step 1');
console.log('Step 2');
console.groupEnd();
```

**Network Debugging:**
```typescript
// Monitor API calls
const response = await fetch('/api/endpoint');
console.log('Response:', response);
console.log('Data:', await response.json());
```

### Backend Debugging

**Debug Mode:**
```bash
# Start with debug output
DEBUG=animagen:* npm run dev

# Debug specific modules
DEBUG=animagen:ffmpeg,animagen:upload npm run dev
```

**Logging:**
```javascript
// Add structured logging
console.log(`[${new Date().toISOString()}] Processing started for session: ${sessionId}`);
console.error(`[ERROR] FFmpeg failed:`, error);
```

**FFmpeg Debugging:**
```javascript
// Enable FFmpeg verbose output
ffmpeg
  .input(inputPath)
  .output(outputPath)
  .on('start', (commandLine) => {
    console.log('FFmpeg command:', commandLine);
  })
  .on('stderr', (stderrLine) => {
    console.log('FFmpeg stderr:', stderrLine);
  });
```

## 📦 Build & Deployment

### Development Build

```bash
# Frontend development build
cd frontend && npm run build

# Backend doesn't require build (Node.js)
```

### Production Build

```bash
# Build frontend for production
cd frontend && npm run build

# Copy built files to backend public directory
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

# Start production server
cd backend && npm start
```

### Docker Development

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 3001 5173

# Start development servers
CMD ["npm", "run", "dev"]
```

```bash
# Build and run development container
docker build -f Dockerfile.dev -t animagen-dev .
docker run -p 3001:3001 -p 5173:5173 animagen-dev
```

## 🤝 Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch** from `main`
3. **Make changes** following code standards
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Run tests** and ensure they pass
7. **Submit pull request** with clear description

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Examples:**
```
feat(timeline): add new transition effects
fix(export): resolve FFmpeg memory leak
docs(api): update endpoint documentation
```

### Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Performance impact is considered
- [ ] Security implications are reviewed
