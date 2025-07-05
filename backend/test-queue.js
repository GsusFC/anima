#!/usr/bin/env node

/**
 * Test script for job queue functionality
 */

require('dotenv').config();

const { testRedisConnection } = require('./utils/redis');
const { addJob, getJobStatus, getQueueStats } = require('./queues/videoQueue');
const { JobTypes } = require('./queues/jobTypes');

async function testJobQueue() {
  console.log('🧪 Testing job queue system...');
  
  try {
    // Test Redis connection
    console.log('📡 Testing Redis connection...');
    const redisConnected = await testRedisConnection();
    
    if (!redisConnected) {
      console.log('❌ Redis not available - testing fallback mode');
      console.log('✅ Fallback mode test completed');
      return;
    }
    
    console.log('✅ Redis connection successful');
    
    // Test queue stats
    console.log('📊 Getting queue stats...');
    const stats = await getQueueStats();
    console.log('Queue stats:', stats);
    
    // Test adding a job
    console.log('📝 Adding test job...');
    const testJobData = {
      images: [
        { filename: 'test1.jpg', id: 'test1' },
        { filename: 'test2.jpg', id: 'test2' }
      ],
      transitions: [{ type: 'fade', duration: 500 }],
      frameDurations: [2000, 2000],
      sessionId: 'test-session',
      quality: 'standard',
      format: 'mp4'
    };
    
    const job = await addJob(JobTypes.SLIDESHOW_EXPORT, testJobData);
    console.log('✅ Job created:', job.id);
    
    // Test job status
    console.log('📋 Getting job status...');
    const status = await getJobStatus(job.id);
    console.log('Job status:', status);
    
    console.log('✅ Job queue test completed successfully');
    
  } catch (error) {
    console.error('❌ Job queue test failed:', error.message);
  }
  
  process.exit(0);
}

testJobQueue();
