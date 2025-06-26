// Test setup file
const path = require('path');
const fs = require('fs');

// Ensure test assets directory exists
const testAssetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(testAssetsDir)) {
  fs.mkdirSync(testAssetsDir, { recursive: true });
}

// Mock console.log for cleaner test output
const originalLog = console.log;
console.log = (...args) => {
  // Only show logs that contain 'error' or 'fail' during tests
  if (args.some(arg => 
    typeof arg === 'string' && 
    (arg.toLowerCase().includes('error') || arg.toLowerCase().includes('fail'))
  )) {
    originalLog(...args);
  }
};

// Restore console.log after tests
afterAll(() => {
  console.log = originalLog;
}); 