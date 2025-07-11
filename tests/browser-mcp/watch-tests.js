#!/usr/bin/env node

/**
 * Watch mode for BrowserMCP tests
 * Automatically re-runs tests when files change
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const BrowserMCPTestRunner = require('./run-tests.js');

class WatchTestRunner {
  constructor() {
    this.isRunning = false;
    this.watchedPaths = [
      'frontend/src/slideshow/components/ImageUpload.tsx',
      'frontend/src/slideshow/hooks/useSlideshow.ts',
      'frontend/src/slideshow/context/SlideshowContext.tsx',
      'tests/browser-mcp/'
    ];
    this.debounceTimeout = null;
  }

  async startWatching() {
    console.log('👀 Starting BrowserMCP test watcher...');
    console.log('📁 Watching paths:');
    this.watchedPaths.forEach(path => {
      console.log(`   - ${path}`);
    });
    console.log('');

    // Initial test run
    await this.runTests();

    // Set up file watchers
    this.watchedPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        const stats = fs.statSync(watchPath);
        
        if (stats.isDirectory()) {
          this.watchDirectory(watchPath);
        } else {
          this.watchFile(watchPath);
        }
      }
    });

    console.log('🔄 Watching for changes... (Press Ctrl+C to stop)');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping test watcher...');
      process.exit(0);
    });
  }

  watchFile(filePath) {
    fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        this.onFileChange(filePath);
      }
    });
  }

  watchDirectory(dirPath) {
    fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.js'))) {
        const fullPath = path.join(dirPath, filename);
        this.onFileChange(fullPath);
      }
    });
  }

  onFileChange(filePath) {
    console.log(`📝 File changed: ${filePath}`);
    
    // Debounce to avoid running tests too frequently
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.runTests();
    }, 1000);
  }

  async runTests() {
    if (this.isRunning) {
      console.log('⏳ Tests already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('\n🔄 Running tests due to file changes...');
      console.log('='.repeat(50));
      
      const runner = new BrowserMCPTestRunner();
      await runner.run();
      
      console.log('='.repeat(50));
      console.log('✅ Tests completed, watching for more changes...\n');
      
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      console.log('='.repeat(50));
      console.log('🔄 Continuing to watch for changes...\n');
    } finally {
      this.isRunning = false;
    }
  }
}

// Run watcher if this file is executed directly
if (require.main === module) {
  const watcher = new WatchTestRunner();
  watcher.startWatching().catch(console.error);
}

module.exports = WatchTestRunner;
