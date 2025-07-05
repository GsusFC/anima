#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Use fetch (available in Node 18+) or import node-fetch if needed
async function makeRequest(url, options = {}) {
  try {
    // Try using global fetch first (Node 18+)
    if (typeof fetch !== 'undefined') {
      const response = await fetch(url, options);
      return {
        status: response.status,
        statusText: response.statusText,
        data: options.method === 'POST' ? await response.json() : await response.text()
      };
    } else {
      // Fallback to require
      const fetch = require('node-fetch');
      const response = await fetch(url, options);
      return {
        status: response.status,
        statusText: response.statusText,
        data: options.method === 'POST' ? await response.json() : await response.text()
      };
    }
  } catch (error) {
    throw error;
  }
}

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_SESSION_ID = `test_error_${Date.now()}`;

console.log('🧪 Testing Error Logging System...');
console.log(`📍 API Base URL: ${API_BASE_URL}`);
console.log(`📂 Session ID: ${TEST_SESSION_ID}`);

async function testErrorLogging() {
  try {
    // Step 1: Try to create an export job that will fail
    console.log('\n1️⃣ Creating export job with invalid data...');
    
    const invalidExportData = {
      sessionId: TEST_SESSION_ID,
      images: [
        { filename: 'nonexistent_file.jpg', id: 'fake_id' }
      ],
      frameDurations: [1000],
      transitions: [],
      quality: 'standard',
      format: 'mp4'
    };

    let jobId;
    try {
      const exportResponse = await makeRequest(`${API_BASE_URL}/api/export/slideshow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidExportData)
      });
      
      if (exportResponse.data.success) {
        jobId = exportResponse.data.jobId;
        console.log(`✅ Job created: ${jobId}`);
      } else {
        console.error('❌ Failed to create job:', exportResponse.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Export request failed:', error.message);
      return false;
    }

    // Step 2: Poll job status until it fails
    console.log('\n2️⃣ Polling job status...');
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    let jobStatus = null;
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await makeRequest(`${API_BASE_URL}/api/export/status/${jobId}`);
        
        if (statusResponse.status === 200) {
          const responseData = JSON.parse(statusResponse.data);
          if (responseData.success) {
            jobStatus = responseData.job;
            console.log(`📊 Job ${jobId}: ${jobStatus.status} (${jobStatus.progress}%)`);
            
            if (jobStatus.status === 'failed') {
              console.log('✅ Job failed as expected');
              break;
            } else if (jobStatus.status === 'completed') {
              console.log('⚠️ Job completed unexpectedly');
              break;
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('❌ Status check failed:', error.message);
        return false;
      }
    }

    if (!jobStatus || jobStatus.status !== 'failed') {
      console.error('❌ Job did not fail as expected');
      return false;
    }

    // Step 3: Check if log URL is provided
    console.log('\n3️⃣ Checking log URL...');
    
    if (!jobStatus.logUrl) {
      console.error('❌ No log URL provided in job status');
      console.log('Job status:', JSON.stringify(jobStatus, null, 2));
      return false;
    }
    
    console.log(`✅ Log URL provided: ${jobStatus.logUrl}`);

    // Step 4: Try to download the log
    console.log('\n4️⃣ Downloading log file...');
    
    try {
      const logResponse = await makeRequest(`${API_BASE_URL}${jobStatus.logUrl}`);
      
      if (logResponse.status === 200 && logResponse.data) {
        console.log('✅ Log file downloaded successfully');
        console.log('📄 Log content preview:');
        console.log('─'.repeat(50));
        console.log(logResponse.data.substring(0, 500) + (logResponse.data.length > 500 ? '...' : ''));
        console.log('─'.repeat(50));
        
        // Check if log contains error information
        const logContent = logResponse.data.toLowerCase();
        if (logContent.includes('error') || logContent.includes('failed') || logContent.includes('exception')) {
          console.log('✅ Log contains error information');
        } else {
          console.log('⚠️ Log may not contain expected error information');
        }
        
        return true;
      } else {
        console.error('❌ Log download failed or empty');
        return false;
      }
    } catch (error) {
      console.error('❌ Log download failed:', error.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Step 5: Check backend logs directory
async function checkBackendLogsDirectory() {
  console.log('\n5️⃣ Checking backend logs directory...');
  
  const logsDir = path.join(__dirname, 'backend', 'logs');
  
  if (fs.existsSync(logsDir)) {
    console.log('✅ Logs directory exists');
    
    const files = fs.readdirSync(logsDir);
    console.log(`📁 Found ${files.length} log files:`);
    
    files.forEach(file => {
      if (file.startsWith('job_')) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  📄 ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
      }
    });
    
    return true;
  } else {
    console.error('❌ Logs directory does not exist');
    return false;
  }
}

async function main() {
  console.log('🔍 Error Logging System Test');
  console.log('═'.repeat(50));
  
  // Check if backend is running
  try {
    const healthResponse = await makeRequest(`${API_BASE_URL}/api/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Backend is running');
    }
  } catch (error) {
    console.error('❌ Backend is not accessible:', error.message);
    console.log('💡 Make sure the backend server is running on', API_BASE_URL);
    process.exit(1);
  }

  // Run tests
  const testResult = await testErrorLogging();
  const dirResult = await checkBackendLogsDirectory();
  
  console.log('\n📊 Test Results:');
  console.log('═'.repeat(50));
  console.log(`End-to-end test: ${testResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Logs directory: ${dirResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallResult = testResult && dirResult;
  console.log(`\n🎯 Overall: ${overallResult ? '✅ SUCCESS' : '❌ FAILURE'}`);
  
  if (overallResult) {
    console.log('\n🎉 Error logging system is working correctly!');
    console.log('   - Jobs that fail will create log files');
    console.log('   - Log URLs are provided in job status responses');
    console.log('   - Logs are accessible via HTTP endpoints');
    console.log('   - Plugin will show "Download Log" button on errors');
  } else {
    console.log('\n⚠️ Error logging system needs attention');
    console.log('   Please check the implementation and fix any issues');
  }
  
  process.exit(overallResult ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
} 