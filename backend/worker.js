#!/usr/bin/env node

/**
 * Standalone worker process for handling export jobs
 * This can be run separately from the main server for better scalability
 */

require('dotenv').config();

const workerManager = require('./workers/workerManager');

console.log('🚀 Starting AnimaGen Export Worker...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

async function startWorker() {
  try {
    await workerManager.start();
    console.log('✅ Export worker started successfully');
    console.log('🔄 Worker is now processing jobs...');
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down worker...');
  await workerManager.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down worker...');
  await workerManager.stop();
  process.exit(0);
});
