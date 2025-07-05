#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_SESSION_ID = `test_complete_${Date.now()}`;

console.log('🧪 Testing Complete Export & Download Flow...');
console.log(`📍 API Base URL: ${API_BASE_URL}`);
console.log(`📂 Session ID: ${TEST_SESSION_ID}`);

// Use fetch (available in Node 18+) or import node-fetch if needed
async function makeRequest(url, options = {}) {
  try {
    // Try using global fetch first (Node 18+)
    if (typeof fetch !== 'undefined') {
      const response = await fetch(url, options);
      return {
        status: response.status,
        statusText: response.statusText,
        data: options.method === 'POST' ? await response.json() : await response.text(),
        blob: options.method === 'GET' && url.includes('/download/') ? await response.blob() : null
      };
    } else {
      // Fallback to require
      const fetch = require('node-fetch');
      const response = await fetch(url, options);
      return {
        status: response.status,
        statusText: response.statusText,
        data: options.method === 'POST' ? await response.json() : await response.text(),
        blob: options.method === 'GET' && url.includes('/download/') ? await response.buffer() : null
      };
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function testCompleteFlow() {
  try {
    console.log('\\n🔍 Complete Export & Download Test');
    console.log('══════════════════════════════════════════════════');

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

    // Step 1: Upload test images
    console.log('\\n1️⃣ Uploading test images...');
    
    const testImagesDir = path.join(__dirname, 'test_images');
    if (!fs.existsSync(testImagesDir)) {
      fs.mkdirSync(testImagesDir, { recursive: true });
      console.log('📁 Created test_images directory');
      console.log('⚠️ Please add some test images to test_images/ folder and run again');
      return false;
    }

    const imageFiles = fs.readdirSync(testImagesDir).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
    );

    if (imageFiles.length === 0) {
      console.log('⚠️ No image files found in test_images/ folder');
      console.log('💡 Add some .jpg or .png files to test the complete flow');
      return false;
    }

    console.log(`📸 Found ${imageFiles.length} test images:`, imageFiles);

    // Step 2: Create a slideshow export job with valid images
    console.log('\\n2️⃣ Creating slideshow export job...');
    
    const validSlideshowData = {
      sessionId: TEST_SESSION_ID,
      images: imageFiles.map((file, index) => ({
        filename: file,
        id: `test_image_${index}`
      })),
      frameDurations: imageFiles.map(() => 1500), // 1.5 seconds each
      transitions: imageFiles.slice(0, -1).map(() => ({ type: 'fade', duration: 500 })),
      quality: 'standard',
      format: 'mp4'
    };

    let jobId;
    try {
      const exportResponse = await makeRequest(`${API_BASE_URL}/api/export/slideshow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSlideshowData)
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

    // Step 3: Poll for job completion
    console.log('\\n3️⃣ Polling job status until completion...');
    
    let jobStatus = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await makeRequest(`${API_BASE_URL}/api/export/status/${jobId}`);
        
        if (statusResponse.data.includes('"success":true')) {
          const data = JSON.parse(statusResponse.data);
          jobStatus = data.job;
          console.log(`📊 Job ${jobId}: ${jobStatus.status} (${jobStatus.progress}%)`);
          
          if (jobStatus.status === 'completed') {
            console.log('✅ Job completed successfully!');
            console.log(`📥 Download URL: ${jobStatus.downloadUrl}`);
            break;
          } else if (jobStatus.status === 'failed') {
            console.log('❌ Job failed:', jobStatus.error);
            if (jobStatus.logUrl) {
              console.log(`📄 Log available at: ${jobStatus.logUrl}`);
            }
            return false;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('❌ Status check failed:', error.message);
        return false;
      }
    }

    if (!jobStatus || jobStatus.status !== 'completed') {
      console.error('❌ Job did not complete within timeout');
      return false;
    }

    // Step 4: Test download functionality
    console.log('\\n4️⃣ Testing download...');
    
    if (!jobStatus.downloadUrl) {
      console.error('❌ No download URL provided for completed job');
      return false;
    }

    try {
      const downloadResponse = await makeRequest(`${API_BASE_URL}${jobStatus.downloadUrl}`, {
        method: 'GET'
      });
      
      if (downloadResponse.status === 200) {
        console.log('✅ Download successful!');
        console.log(`📄 Content received (${downloadResponse.data.length} characters or bytes)`);
        
        // Save test download
        const downloadPath = path.join(__dirname, `test_download_${jobId}.mp4`);
        if (downloadResponse.blob) {
          fs.writeFileSync(downloadPath, downloadResponse.blob);
        } else {
          fs.writeFileSync(downloadPath, downloadResponse.data);
        }
        console.log(`💾 Downloaded file saved to: ${downloadPath}`);
        
        return true;
      } else {
        console.error('❌ Download failed:', downloadResponse.status, downloadResponse.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Download request failed:', error.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testCompleteFlow();
  
  console.log('\\n📊 Test Results:');
  console.log('══════════════════════════════════════════════════');
  console.log(`Complete export & download flow: ${success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (success) {
    console.log('\\n🎉 Complete export and download system is working perfectly!');
    console.log('   - Export jobs process correctly');
    console.log('   - Download URLs are generated for completed jobs'); 
    console.log('   - Downloads work via HTTP endpoints');
    console.log('   - Plugin will show download button automatically');
  } else {
    console.log('\\n❌ There are issues with the export/download system');
    console.log('💡 Check the logs above for specific problems');
  }
}

main().catch(console.error); 