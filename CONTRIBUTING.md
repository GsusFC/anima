# Contributing to AnimaGen

> Thank you for your interest in contributing to AnimaGen! This guide will help you get started with contributing to our professional animation creation tool.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive in all interactions
- **Be constructive** when providing feedback
- **Be patient** with newcomers and questions
- **Be collaborative** and help others learn
- **Focus on the project** and avoid personal attacks

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **FFmpeg** installed and accessible
- **Git** for version control
- **Basic knowledge** of React, TypeScript, and Node.js

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/anima.git
   cd anima
   ```

2. **Set up upstream remote**
   ```bash
   git remote add upstream https://github.com/GsusFC/anima.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Verify setup**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 📋 How to Contribute

### 1. **Reporting Bugs**

Before reporting a bug:
- Check existing [issues](https://github.com/GsusFC/anima/issues)
- Try to reproduce the issue
- Gather relevant information

**Bug Report Template:**
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Node.js: [e.g., 18.0.0]
- FFmpeg: [e.g., 4.4.0]

**Additional Context**
Screenshots, logs, or other relevant information.
```

### 2. **Suggesting Features**

For feature requests:
- Check if the feature already exists
- Explain the use case and benefits
- Provide detailed specifications

**Feature Request Template:**
```markdown
**Feature Description**
A clear description of the proposed feature.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Mockups, examples, or references.
```

### 3. **Contributing Code**

#### Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Run all tests
   npm test
   npm run test:ui
   
   # Check code quality
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new transition effect"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description

## 📝 Coding Standards

### TypeScript/JavaScript

```typescript
// Use TypeScript for all new code
interface ComponentProps {
  title: string;
  onAction: (id: string) => void;
}

// Use functional components with hooks
const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  const [state, setState] = useState<string>('');
  
  const handleClick = useCallback(() => {
    onAction('example');
  }, [onAction]);
  
  return (
    <div className="component">
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};
```

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Use JSDoc for functions and complex logic

### File Organization

```
src/
├── components/
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.test.tsx
│   │   ├── ComponentName.module.css
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useHookName.ts
│   └── useHookName.test.ts
├── types/
│   └── index.ts
└── utils/
    ├── utilityName.ts
    └── utilityName.test.ts
```

## 🧪 Testing Guidelines

### Frontend Tests

```typescript
// Component tests
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" onAction={jest.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('handles user interactions', () => {
    const mockAction = jest.fn();
    render(<Component title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalledWith('example');
  });
});
```

### Backend Tests

```javascript
// API tests
const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
  it('should handle file upload', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('images', 'test/fixtures/image.jpg')
      .field('sessionId', 'test-session');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Test Requirements

- **Unit tests** for all new functions and components
- **Integration tests** for API endpoints
- **E2E tests** for critical user workflows
- **Minimum 80% code coverage** for new code

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Processes images into an animated GIF
 * @param images - Array of image file paths
 * @param options - Export configuration options
 * @returns Promise resolving to export result
 * @throws {Error} When FFmpeg processing fails
 */
async function createGIF(
  images: string[],
  options: ExportOptions
): Promise<ExportResult> {
  // Implementation
}
```

### README Updates

When adding features:
- Update feature list
- Add usage examples
- Update installation instructions if needed

### API Documentation

For new endpoints:
- Add to `docs/API.md`
- Include request/response examples
- Document error cases

## 🔄 Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

### Review Criteria

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Performance**: Does it impact performance?
- **Security**: Are there security implications?
- **Tests**: Are tests comprehensive?
- **Documentation**: Is documentation updated?

## 🎯 Contribution Areas

### High Priority

- **Bug fixes** for reported issues
- **Performance improvements** for large files
- **Mobile responsiveness** enhancements
- **Accessibility** improvements
- **Test coverage** increases

### Medium Priority

- **New transition effects** and animations
- **Export format** additions
- **UI/UX** improvements
- **Documentation** enhancements
- **Developer tools** improvements

### Future Features

- **Cloud storage** integration
- **User authentication** system
- **Collaboration** features
- **Mobile app** development
- **Advanced effects** and filters

## 🏷️ Commit Message Format

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/tools

**Examples:**
```
feat(timeline): add new slide transition
fix(export): resolve memory leak in FFmpeg
docs(api): update endpoint documentation
test(upload): add file validation tests
```

## 🆘 Getting Help

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Discord**: Real-time chat with contributors (coming soon)

### Maintainer Contact

- **@GsusFC**: Project maintainer
- **Email**: Available through GitHub profile

### Resources

- **Documentation**: Complete guides in `/docs`
- **Examples**: Sample code in `/examples`
- **Wiki**: Additional resources and tutorials

## 🎉 Recognition

Contributors are recognized through:

- **Contributors list** in README
- **Release notes** acknowledgments
- **GitHub contributor** statistics
- **Special mentions** for significant contributions

## 📄 License

By contributing to AnimaGen, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AnimaGen! Your efforts help make professional animation creation accessible to everyone. 🎬✨
