#!/usr/bin/env node

/**
 * Simple test to verify backend routes are working
 */

// Use simple curl instead of axios
const { exec } = require('child_process');

function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    let curlCmd = `curl -s -w "\\nHTTP_CODE:%{http_code}" "${url}"`;
    
    if (method === 'POST' && data) {
      curlCmd = `curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST -H "Content-Type: application/json" -d '${JSON.stringify(data)}' "${url}"`;
    }
    
    exec(curlCmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n');
      const httpCodeLine = lines.find(line => line.startsWith('HTTP_CODE:'));
      const httpCode = httpCodeLine ? httpCodeLine.replace('HTTP_CODE:', '') : 'unknown';
      const response = lines.filter(line => !line.startsWith('HTTP_CODE:')).join('\n');
      
      resolve({ httpCode, response, stderr });
    });
  });
}

async function testBackendRoutes() {
  console.log('🧪 Testing backend routes...');
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Test health endpoint
    console.log('📡 Testing health endpoint...');
    const healthResult = await testEndpoint(`${baseURL}/api/health`);
    console.log(`✅ Health endpoint: HTTP ${healthResult.httpCode}`);
    
    // Test export stats endpoint
    console.log('📊 Testing export stats endpoint...');
    const statsResult = await testEndpoint(`${baseURL}/api/export/stats`);
    console.log(`📊 Export stats: HTTP ${statsResult.httpCode}`);
    console.log('Response:', statsResult.response.trim() || 'Empty response');
    
    // Test slideshow endpoint
    console.log('🎬 Testing slideshow endpoint...');
    const testData = {
      sessionId: 'test-session',
      images: [{ filename: 'test.png', id: 'test1' }],
      frameDurations: [2000],
      transitions: [],
      quality: 'standard',
      format: 'mp4'
    };
    
    const slideshowResult = await testEndpoint(`${baseURL}/api/export/slideshow`, 'POST', testData);
    console.log(`🎬 Slideshow endpoint: HTTP ${slideshowResult.httpCode}`);
    console.log('Response:', slideshowResult.response.trim() || 'Empty response');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
  }
}

testBackendRoutes();
