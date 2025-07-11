#!/usr/bin/env node

/**
 * Setup verification script for BrowserMCP
 * Checks that all dependencies and configurations are correct
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SetupChecker {
  constructor() {
    this.checks = [];
  }

  async runAllChecks() {
    console.log('🔍 BrowserMCP Setup Verification');
    console.log('================================\n');

    await this.checkBrowserMCPInstallation();
    await this.checkProjectStructure();
    await this.checkAnimaGenRunning();
    await this.checkTestFiles();
    
    this.printResults();
  }

  async checkBrowserMCPInstallation() {
    console.log('📦 Checking BrowserMCP installation...');
    
    try {
      const result = await this.runCommand('npx', ['@agent-infra/mcp-server-browser', '--version']);
      this.addCheck('BrowserMCP Server', true, 'Installed and accessible');
    } catch (error) {
      this.addCheck('BrowserMCP Server', false, 'Not installed or not accessible');
    }
  }

  async checkProjectStructure() {
    console.log('📁 Checking project structure...');
    
    const requiredFiles = [
      'frontend/src/slideshow/components/ImageUpload.tsx',
      'frontend/src/slideshow/hooks/useSlideshow.ts',
      'tests/browser-mcp/run-tests.js',
      'tests/browser-mcp/image-upload-improvements.test.js',
      'mcp-config.json'
    ];

    const requiredDirs = [
      'tests/browser-mcp',
      'tests/browser-mcp/screenshots'
    ];

    // Check files
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addCheck(`File: ${file}`, true, 'Exists');
      } else {
        this.addCheck(`File: ${file}`, false, 'Missing');
      }
    });

    // Check directories
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.addCheck(`Directory: ${dir}`, true, 'Exists');
      } else {
        this.addCheck(`Directory: ${dir}`, false, 'Missing');
      }
    });
  }

  async checkAnimaGenRunning() {
    console.log('🌐 Checking if AnimaGen is running...');

    const ports = [5175, 3000, 5173, 5174]; // Check common Vite ports
    let serverFound = false;
    let serverPort = null;

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok) {
          serverFound = true;
          serverPort = port;
          break;
        }
      } catch (error) {
        // Continue checking other ports
      }
    }

    if (serverFound) {
      this.addCheck('AnimaGen Server', true, `Running on localhost:${serverPort}`);
    } else {
      this.addCheck('AnimaGen Server', false, 'Not running on any common port (3000, 5173-5175)');
    }
  }

  async checkTestFiles() {
    console.log('🧪 Checking test files...');
    
    const testFiles = [
      'tests/browser-mcp/run-tests.js',
      'tests/browser-mcp/watch-tests.js',
      'tests/browser-mcp/image-upload-improvements.test.js'
    ];

    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
        
        this.addCheck(`Test file: ${file}`, true, isExecutable ? 'Exists and executable' : 'Exists');
      } else {
        this.addCheck(`Test file: ${file}`, false, 'Missing');
      }
    });
  }

  addCheck(name, passed, details) {
    this.checks.push({ name, passed, details });
  }

  printResults() {
    console.log('\n📊 Setup Check Results:');
    console.log('========================\n');

    let passedCount = 0;
    let totalCount = this.checks.length;

    this.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.details}`);
      if (check.passed) passedCount++;
    });

    console.log(`\n📈 Summary: ${passedCount}/${totalCount} checks passed\n`);

    if (passedCount === totalCount) {
      console.log('🎉 All checks passed! BrowserMCP is ready to use.');
      console.log('\n🚀 Quick start commands:');
      console.log('  npm run test:imageupload  # Run tests once');
      console.log('  npm run test:watch        # Watch for changes');
    } else {
      console.log('⚠️  Some checks failed. Please fix the issues above before running tests.');
      
      if (!this.checks.find(c => c.name.includes('AnimaGen Server') && c.passed)) {
        console.log('\n💡 To start AnimaGen: npm run dev');
      }
      
      if (!this.checks.find(c => c.name.includes('BrowserMCP Server') && c.passed)) {
        console.log('💡 To install BrowserMCP: npm install -g @agent-infra/mcp-server-browser');
      }
    }
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  }
}

// Run checks if this file is executed directly
if (require.main === module) {
  const checker = new SetupChecker();
  checker.runAllChecks().catch(console.error);
}

module.exports = SetupChecker;
