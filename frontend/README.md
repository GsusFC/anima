# AnimaGen Frontend

Modern React application for creating animated content from images and videos.

## 🎯 Recent Major Refactoring (2024)

AnimaGen has undergone a comprehensive refactoring that:
- **Eliminated 500+ lines** of duplicated code
- **Achieved 100% type safety** (removed all 'as any' usage)
- **Created 4 reusable base components** for consistent UI
- **Implemented 3 shared hooks** for common functionality
- **Centralized styling** with CSS modules

See [REFACTORING_GUIDE.md](./docs/REFACTORING_GUIDE.md) for complete details.

## 🚀 Features

### Slideshow Creator
- Upload multiple images
- Configure transitions and timing
- Export as MP4, GIF, WebM, or MOV
- Real-time preview generation
- Drag & drop reordering

### Video Editor
- Upload and trim video segments
- Apply effects and transitions
- Multi-format export support
- Timeline-based editing
- Frame-accurate trimming

### Shared Capabilities
- Unified export system with validation
- Responsive design for all screen sizes
- Accessibility compliance (WCAG 2.1)
- Real-time progress tracking
- Error handling and recovery

## 🏗️ Architecture

### Base Components
```
shared/components/base/
├── BaseVideoPreview.tsx    # Unified video preview
├── BaseExportBuilder.tsx   # Unified export functionality  
├── BaseUpload.tsx          # Unified upload interface
└── BaseEmptyState.tsx      # Unified empty states
```

### Shared Hooks
```
shared/hooks/
├── useBaseMediaEditor.ts   # Unified state management
├── useDragAndDrop.ts       # Reusable drag & drop
├── useScrollNavigation.ts  # Timeline navigation
└── useMediaUpload.ts       # File upload logic
```

### CSS Modules
```
shared/styles/
├── timeline.module.css     # Timeline components
├── panels.module.css       # Panel layouts
├── buttons.module.css      # Button variants
└── utils.ts               # Style utilities
```

### Unified Types
```
shared/types/
├── unified.types.ts        # Base interfaces
├── media.types.ts          # Media-specific types
├── export.types.ts         # Export-related types
└── validation.types.ts     # Validation interfaces
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- TypeScript 5+

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage

# Validate refactoring
npm run validate:refactoring
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── slideshow/           # Slideshow-specific components
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── types/
│   ├── video-editor/        # Video editor components
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── types/
│   ├── shared/              # Shared components and utilities
│   │   ├── components/
│   │   │   ├── base/        # Base components
│   │   │   ├── unified/     # Unified UI components
│   │   │   └── Media/       # Media-specific components
│   │   ├── hooks/           # Shared hooks
│   │   ├── styles/          # CSS modules
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── docs/                    # Documentation
├── scripts/                 # Build and validation scripts
└── __tests__/               # Test files
```

## 🎨 Styling System

### CSS Modules
AnimaGen uses CSS modules for component styling:

```tsx
import styles from '../shared/styles/panels.module.css';

<div className={styles.panel}>
  <div className={styles.panelHeader}>Title</div>
  <div className={styles.panelContent}>Content</div>
</div>
```

### Style Utilities
```tsx
import { cn, getModeClass } from '../shared/styles/utils';

const className = cn(
  styles.button,
  getModeClass(mode, 'button', styles),
  isActive && styles.buttonActive
);
```

### Design Tokens
- **Slideshow mode**: Pink theme (#ec4899)
- **Video editor mode**: Blue theme (#3b82f6)
- **Dark background**: #0a0a0b
- **Typography**: Space Mono (monospace)

## 🧪 Testing Strategy

### Component Testing
- Unit tests for all base components
- Integration tests for component interaction
- Accessibility testing with @testing-library

### Hook Testing
- Custom hook testing with @testing-library/react-hooks
- State management validation
- Error handling verification

### Validation Testing
- Automated refactoring validation
- Type safety verification
- Code duplication detection

## 📚 API Integration

### Upload Endpoints
```typescript
POST /api/upload/images    # Image upload
POST /api/upload/videos    # Video upload
POST /api/upload/batch     # Batch upload
```

### Export Endpoints
```typescript
POST /api/export/slideshow # Slideshow export
POST /api/export/video     # Video export
GET  /api/export/status    # Export status
```

### Preview Endpoints
```typescript
POST /api/preview/generate # Generate preview
GET  /api/preview/:id      # Get preview
```

## 🔧 Configuration

### Environment Variables
```bash
VITE_API_URL=http://localhost:3001
VITE_UPLOAD_MAX_SIZE=500MB
VITE_PREVIEW_QUALITY=medium
```

### Build Configuration
- **Vite**: Fast build tool and dev server
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📈 Performance

### Bundle Analysis
- Base components: ~45KB gzipped
- Shared hooks: ~12KB gzipped
- CSS modules: ~8KB gzipped
- Total reduction: ~15% from refactoring

### Optimization Features
- Code splitting by route
- Lazy loading of heavy components
- CSS module tree shaking
- Image optimization
- Service worker caching

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes using base components
3. Add tests for new functionality
4. Run validation: `npm run validate:refactoring`
5. Submit pull request

### Code Standards
- Use TypeScript for all new code
- Extend base components when possible
- Follow CSS module patterns
- Maintain 100% type safety
- Add tests for new features

### Architecture Guidelines
- Prefer composition over inheritance
- Use shared hooks for common logic
- Implement proper error boundaries
- Follow accessibility best practices
- Document complex components

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- React team for the excellent framework
- Vite team for the fast build tool
- TypeScript team for type safety
- Testing Library for testing utilities
- All contributors to the refactoring effort
