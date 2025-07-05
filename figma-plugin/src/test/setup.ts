import '@testing-library/jest-dom';

// Mock Figma API
global.figma = {
  ui: {
    postMessage: jest.fn(),
    close: jest.fn(),
  },
  showUI: jest.fn(),
  closePlugin: jest.fn(),
  // Add other Figma API mocks as needed
};

// Mock parent.postMessage for plugin communication
Object.defineProperty(window, 'parent', {
  value: {
    postMessage: jest.fn(),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch globally
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
