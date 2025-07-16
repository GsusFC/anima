import 'dotenv/config';
import { initializeApp } from './app';

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('⚠️ Server will continue running...');
  // Exit in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('⚠️ Server will continue running...');
  // Exit in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Memory monitoring for debugging
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const memInfo = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100
  };
  console.log(`📊 Memory usage: RSS: ${memInfo.rss}MB, Heap: ${memInfo.heapUsed}/${memInfo.heapTotal}MB, External: ${memInfo.external}MB`);

  // Warn if memory usage is high
  if (memInfo.heapUsed > 500) {
    console.warn(`⚠️ High memory usage detected: ${memInfo.heapUsed}MB heap used`);
  }
};

// Log memory usage every 5 minutes
setInterval(logMemoryUsage, 5 * 60 * 1000);

/**
 * Bootstrap the application
 */
async function bootstrap() {
  try {
    // Initialize the application
    const { server } = await initializeApp();
    
    // Start HTTP server
    const PORT = parseInt(process.env.PORT || '3002', 10);
    server.listen(PORT, () => {
      console.log(`🚀 AnimaGen backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
      logMemoryUsage();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap().catch(error => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
