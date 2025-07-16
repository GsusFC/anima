/**
 * AnimaGen Backend - Main Entry Point
 * 
 * This is the main entry point for the AnimaGen backend application.
 * It configures the environment, sets up global error handlers,
 * and bootstraps the Express server.
 */

// Import environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';

// Import utilities and configuration
import { logMemoryUsage, setupMemoryMonitoring } from './utils';
import config from './config';

// Initialize environment variables
dotenv.config();

// Import server module (will be implemented in server.ts)
import { createServer } from './server';

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('⚠️ Server will continue running...');
  
  // Log memory usage to help diagnose issues
  logMemoryUsage();
  
  // Exit in production to allow process manager to restart
  if (process.env.NODE_ENV === 'production') {
    console.error('🔄 Exiting process in production environment');
    process.exit(1);
  }
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('⚠️ Server will continue running...');
  
  // Log memory usage to help diagnose issues
  logMemoryUsage();
  
  // Exit in production to allow process manager to restart
  if (process.env.NODE_ENV === 'production') {
    console.error('🔄 Exiting process in production environment');
    process.exit(1);
  }
});

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 AnimaGen backend starting...');
    console.log(`🌍 Environment: ${config.app.env}`);
    
    // Set up memory monitoring
    if (config.memoryMonitoring.enabled) {
      setupMemoryMonitoring(config.memoryMonitoring.interval);
      console.log(`📊 Memory monitoring enabled (interval: ${config.memoryMonitoring.interval / 1000}s)`);
    }
    
    // Create and start the Express server
    const { server, port } = await createServer();

    // Start listening on the configured port
    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        resolve();
      });
    });
    
    // Log successful startup
    console.log(`✅ AnimaGen backend running on port ${port}`);
    console.log(`💻 Server URL: http://localhost:${port}`);
    console.log(`🛠️ API Status: http://localhost:${port}/api/status`);
    console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('👋 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap().catch((error: Error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
