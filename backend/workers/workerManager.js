const ExportWorker = require('./exportWorker');
const { testRedisConnection } = require('../utils/redis');

class WorkerManager {
  constructor() {
    this.workers = [];
    this.isStarted = false;
  }

  async start() {
    if (this.isStarted) {
      console.log('⚠️ Worker manager already started');
      return;
    }

    try {
      // Test Redis connection first
      const redisConnected = await testRedisConnection();
      if (!redisConnected) {
        throw new Error('Redis connection failed');
      }

      const workerCount = parseInt(process.env.WORKER_COUNT) || 1;
      
      console.log(`🚀 Starting ${workerCount} export worker(s)...`);
      
      for (let i = 0; i < workerCount; i++) {
        const worker = new ExportWorker();
        this.workers.push(worker);
        console.log(`✅ Export worker ${i + 1} started`);
      }

      this.isStarted = true;
      console.log('✅ All export workers started successfully');

      // Set up periodic cleanup
      this.setupCleanup();

    } catch (error) {
      console.error('❌ Failed to start workers:', error.message);
      throw error;
    }
  }

  setupCleanup() {
    // Clean up old jobs every hour
    setInterval(async () => {
      try {
        const { cleanQueue } = require('../queues/videoQueue');
        await cleanQueue();
      } catch (error) {
        console.error('❌ Cleanup error:', error.message);
      }
    }, 3600 * 1000); // 1 hour

    console.log('✅ Cleanup scheduler started');
  }

  async stop() {
    if (!this.isStarted) {
      console.log('⚠️ Worker manager not started');
      return;
    }

    try {
      console.log('🛑 Stopping export workers...');
      
      const closePromises = this.workers.map(worker => worker.close());
      await Promise.all(closePromises);
      
      this.workers = [];
      this.isStarted = false;
      
      console.log('✅ All export workers stopped');
    } catch (error) {
      console.error('❌ Failed to stop workers:', error.message);
      throw error;
    }
  }

  getStatus() {
    return {
      isStarted: this.isStarted,
      workerCount: this.workers.length,
      workers: this.workers.map((worker, index) => ({
        id: index + 1,
        status: 'running'
      }))
    };
  }
}

// Global worker manager instance
const workerManager = new WorkerManager();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down workers...');
  await workerManager.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down workers...');
  await workerManager.stop();
  process.exit(0);
});

module.exports = workerManager;
